import { CandleInterval, MarketRankType, Prisma, SyncJobStatus } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db.js";

type IntervalCode = "1h" | "4h" | "1d";

interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning?: string;
}

interface UpbitTicker {
  market: string;
  acc_trade_price_24h?: number;
  acc_trade_price?: number;
}

interface UpbitCandle {
  candle_date_time_utc: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
}

const marketLimit = getNumberEnv("SYNC_MARKET_LIMIT", 20);
const pageDelayMs = getNumberEnv("SYNC_PAGE_DELAY_MS", 150);
const retryDelayMs = getNumberEnv("SYNC_RETRY_DELAY_MS", 1000);
const maxPagesPerJob = getNumberEnv("SYNC_MAX_PAGES_PER_JOB", 10000);
const intervals = parseIntervals(process.env.SYNC_INTERVALS ?? "1h,4h,1d");

async function main() {
  console.log(`Initial candle sync started. markets=${marketLimit}, intervals=${intervals.join(",")}`);

  const markets = await ensureTargetMarkets(marketLimit);
  for (const market of markets) {
    for (const interval of intervals) {
      await syncMarketInterval(market.market, interval);
    }
  }

  console.log("Initial candle sync completed.");
}

async function ensureTargetMarkets(limit: number) {
  const existing = await prisma.market.findMany({
    where: { isActive: true },
    orderBy: [{ rank: "asc" }, { market: "asc" }],
    take: limit,
  });

  if (existing.length >= limit) {
    return existing;
  }

  const markets = await fetchTopTradeVolumeMarkets(limit);
  for (const market of markets) {
    await prisma.market.upsert({
      where: { market: market.symbol },
      create: {
        market: market.symbol,
        koreanName: market.koreanName,
        englishName: market.englishName,
        rank: market.rank,
        rankType: MarketRankType.TRADE_VOLUME,
        isActive: true,
      },
      update: {
        koreanName: market.koreanName,
        englishName: market.englishName,
        rank: market.rank,
        rankType: MarketRankType.TRADE_VOLUME,
        isActive: true,
      },
    });
  }

  return prisma.market.findMany({
    where: { isActive: true },
    orderBy: [{ rank: "asc" }, { market: "asc" }],
    take: limit,
  });
}

async function syncMarketInterval(market: string, interval: IntervalCode) {
  const prismaInterval = toPrismaInterval(interval);
  const job = await prisma.candleSyncJob.upsert({
    where: {
      market_interval: {
        market,
        interval: prismaInterval,
      },
    },
    create: {
      market,
      interval: prismaInterval,
      status: SyncJobStatus.RUNNING,
      startedAt: new Date(),
    },
    update: {
      status: SyncJobStatus.RUNNING,
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
    },
  });

  console.log(`[${market} ${interval}] sync started. job=${job.id}`);

  try {
    const cursor = new Date(Date.now() + getIntervalMs(interval));
    const result = await syncBackward(market, interval, prismaInterval, cursor, job.id);

    await prisma.candleSyncJob.update({
      where: { id: job.id },
      data: {
        status: SyncJobStatus.COMPLETED,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(`[${market} ${interval}] sync completed. saved=${result.saved}`);
  } catch (error) {
    await prisma.candleSyncJob.update({
      where: { id: job.id },
      data: {
        status: SyncJobStatus.FAILED,
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    console.error(`[${market} ${interval}] sync failed`, error);
  }
}

async function syncBackward(
  market: string,
  interval: IntervalCode,
  prismaInterval: CandleInterval,
  startCursor: Date,
  jobId: bigint
) {
  let cursor = startCursor;
  let totalSaved = 0;

  for (let page = 0; page < maxPagesPerJob; page += 1) {
    const candles = await withRetry(() => fetchUpbitCandlePage(market, interval, cursor));
    if (candles.length === 0) {
      return { saved: totalSaved, nextPage: page };
    }

    const saved = await upsertCandles(market, prismaInterval, candles);
    totalSaved += saved;

    const newest = new Date(`${candles[0].candle_date_time_utc}Z`);
    const oldest = new Date(`${candles[candles.length - 1].candle_date_time_utc}Z`);
    await prisma.candleSyncJob.update({
      where: { id: jobId },
      data: { lastSyncedAt: oldest },
    });

    console.log(
      `[${market} ${interval}] page=${page + 1}, saved=${saved}, newest=${newest.toISOString()}, oldest=${oldest.toISOString()}`
    );

    cursor = new Date(oldest.getTime() - 1);
    await sleep(pageDelayMs);
  }

  return { saved: totalSaved, nextPage: maxPagesPerJob };
}

async function fetchTopTradeVolumeMarkets(limit: number) {
  const markets = await fetchUpbitMarkets();
  const tickers = await fetchUpbitTickers(markets.map((market) => market.market));
  const tickerByMarket = new Map(tickers.map((ticker) => [ticker.market, ticker]));

  return markets
    .map((market) => {
      const ticker = tickerByMarket.get(market.market);
      return {
        symbol: market.market,
        koreanName: market.korean_name,
        englishName: market.english_name,
        rank: 0,
        tradePrice24h: ticker?.acc_trade_price_24h ?? ticker?.acc_trade_price ?? 0,
      };
    })
    .sort((a, b) => b.tradePrice24h - a.tradePrice24h)
    .slice(0, limit)
    .map((market, index) => ({ ...market, rank: index + 1 }));
}

async function fetchUpbitMarkets() {
  const response = await fetch(`${config.UPBIT_API_BASE_URL}/market/all?isDetails=true`);
  if (!response.ok) {
    throw new Error(`Upbit market API failed: ${response.status}`);
  }

  const markets = (await response.json()) as UpbitMarket[];
  return markets.filter((market) => market.market.startsWith("KRW-") && market.market_warning !== "CAUTION");
}

async function fetchUpbitTickers(markets: string[]) {
  const tickers: UpbitTicker[] = [];
  for (const marketChunk of chunk(markets, 100)) {
    const params = new URLSearchParams({ markets: marketChunk.join(",") });
    const response = await fetch(`${config.UPBIT_API_BASE_URL}/ticker?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Upbit ticker API failed: ${response.status}`);
    }
    tickers.push(...((await response.json()) as UpbitTicker[]));
  }
  return tickers;
}

async function fetchUpbitCandlePage(market: string, interval: IntervalCode, to: Date) {
  const endpoint = interval === "1h" ? "candles/minutes/60" : interval === "4h" ? "candles/minutes/240" : "candles/days";
  const params = new URLSearchParams({
    market,
    to: to.toISOString(),
    count: "200",
  });

  const response = await fetch(`${config.UPBIT_API_BASE_URL}/${endpoint}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Upbit candle API failed: ${response.status}`);
  }

  return (await response.json()) as UpbitCandle[];
}

async function upsertCandles(market: string, interval: CandleInterval, candles: UpbitCandle[]) {
  let saved = 0;

  for (const candle of candles) {
    const timestamp = new Date(`${candle.candle_date_time_utc}Z`);
    await prisma.candle.upsert({
      where: {
        market_interval_timestamp: {
          market,
          interval,
          timestamp,
        },
      },
      create: {
        market,
        interval,
        timestamp,
        open: new Prisma.Decimal(candle.opening_price),
        high: new Prisma.Decimal(candle.high_price),
        low: new Prisma.Decimal(candle.low_price),
        close: new Prisma.Decimal(candle.trade_price),
        volume: new Prisma.Decimal(candle.candle_acc_trade_volume),
        source: "upbit",
      },
      update: {
        open: new Prisma.Decimal(candle.opening_price),
        high: new Prisma.Decimal(candle.high_price),
        low: new Prisma.Decimal(candle.low_price),
        close: new Prisma.Decimal(candle.trade_price),
        volume: new Prisma.Decimal(candle.candle_acc_trade_volume),
        fetchedAt: new Date(),
      },
    });
    saved += 1;
  }

  return saved;
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(retryDelayMs * attempt);
      }
    }
  }
  throw lastError;
}

function toPrismaInterval(interval: IntervalCode) {
  if (interval === "1h") return CandleInterval.ONE_HOUR;
  if (interval === "4h") return CandleInterval.FOUR_HOUR;
  return CandleInterval.ONE_DAY;
}

function parseIntervals(value: string) {
  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is IntervalCode => item === "1h" || item === "4h" || item === "1d");

  return parsed.length > 0 ? parsed : (["1h", "4h", "1d"] satisfies IntervalCode[]);
}

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getIntervalMs(interval: IntervalCode) {
  if (interval === "1h") return 60 * 60 * 1000;
  if (interval === "4h") return 4 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

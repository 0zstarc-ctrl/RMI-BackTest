import { FastifyInstance } from "fastify";
import { CandleInterval, Prisma } from "@prisma/client";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";

interface UpbitCandle {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
}

interface CandleDto {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const candlesQuerySchema = z.object({
  market: z.string().regex(/^KRW-[A-Z0-9]+$/),
  interval: z.enum(["1h", "4h", "1d"]),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export async function registerCandleRoutes(app: FastifyInstance) {
  app.get("/api/candles", async (request, reply) => {
    const query = candlesQuerySchema.parse(request.query);

    if (query.from >= query.to) {
      return reply.code(400).send({
        message: "from은 to보다 이전이어야 합니다.",
      });
    }

    try {
      const interval = toPrismaInterval(query.interval);
      await ensureMarketExists(query.market);

      const existing = await findCandles(query.market, interval, query.from, query.to);
      if (hasEnoughCandles(existing, query.from, query.to, query.interval)) {
        return { candles: existing.map(toCandleDto), source: "database" };
      }

      const fetched = await fetchUpbitCandles(query.market, query.interval, query.from, query.to);
      await upsertCandles(query.market, interval, fetched);

      const candles = await findCandles(query.market, interval, query.from, query.to);
      return { candles: candles.map(toCandleDto), source: "upbit" };
    } catch (error) {
      app.log.error(error);
      return reply.code(503).send({
        message: "캔들 데이터를 조회할 수 없습니다.",
      });
    }
  });
}

async function ensureMarketExists(market: string) {
  await prisma.market.upsert({
    where: { market },
    create: {
      market,
      koreanName: market,
      englishName: market,
      rankType: "MANUAL",
      isActive: true,
    },
    update: {},
  });
}

function toPrismaInterval(interval: "1h" | "4h" | "1d") {
  if (interval === "1h") return CandleInterval.ONE_HOUR;
  if (interval === "4h") return CandleInterval.FOUR_HOUR;
  return CandleInterval.ONE_DAY;
}

function getIntervalMs(interval: "1h" | "4h" | "1d") {
  if (interval === "1h") return 60 * 60 * 1000;
  if (interval === "4h") return 4 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

async function findCandles(market: string, interval: CandleInterval, from: Date, to: Date) {
  return prisma.candle.findMany({
    where: {
      market,
      interval,
      timestamp: {
        gte: from,
        lte: to,
      },
    },
    orderBy: { timestamp: "asc" },
  });
}

function hasEnoughCandles(
  candles: Array<{ timestamp: Date }>,
  from: Date,
  to: Date,
  interval: "1h" | "4h" | "1d"
) {
  if (candles.length === 0) return false;

  const intervalMs = getIntervalMs(interval);
  const expected = Math.floor((to.getTime() - from.getTime()) / intervalMs) + 1;
  const coverageThreshold = Math.max(1, Math.floor(expected * 0.95));

  return candles.length >= coverageThreshold;
}

async function fetchUpbitCandles(market: string, interval: "1h" | "4h" | "1d", from: Date, to: Date) {
  const candles: UpbitCandle[] = [];
  // Upbit's `to` cursor is exclusive around exact candle boundaries, so start
  // one interval after the requested end to include the final requested candle.
  let cursor = new Date(to.getTime() + getIntervalMs(interval));

  for (let page = 0; page < 200; page += 1) {
    const batch = await withRetry(() => fetchUpbitCandlePage(market, interval, cursor));
    if (batch.length === 0) break;

    candles.push(...batch);

    const oldest = new Date(`${batch[batch.length - 1].candle_date_time_utc}Z`);
    if (oldest <= from) break;

    cursor = new Date(oldest.getTime() - 1);
    await sleep(120);
  }

  return dedupeCandles(candles)
    .filter((candle) => {
      const timestamp = new Date(`${candle.candle_date_time_utc}Z`);
      return timestamp >= from && timestamp <= to;
    })
    .sort((a, b) => new Date(`${a.candle_date_time_utc}Z`).getTime() - new Date(`${b.candle_date_time_utc}Z`).getTime());
}

async function fetchUpbitCandlePage(market: string, interval: "1h" | "4h" | "1d", to: Date) {
  const endpoint = interval === "1h" ? "candles/minutes/60" : interval === "4h" ? "candles/minutes/240" : "candles/days";
  const params = new URLSearchParams({
    market,
    to: to.toISOString(),
    count: "200",
  });

  const response = await fetch(`${config.UPBIT_API_BASE_URL}/${endpoint}?${params.toString()}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upbit candle API failed: ${response.status} ${body}`);
  }

  return (await response.json()) as UpbitCandle[];
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(500 * attempt);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dedupeCandles(candles: UpbitCandle[]) {
  const byTimestamp = new Map<string, UpbitCandle>();
  for (const candle of candles) {
    byTimestamp.set(candle.candle_date_time_utc, candle);
  }
  return Array.from(byTimestamp.values());
}

async function upsertCandles(market: string, interval: CandleInterval, candles: UpbitCandle[]) {
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
  }
}

function toCandleDto(candle: {
  timestamp: Date;
  open: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  close: Prisma.Decimal;
  volume: Prisma.Decimal;
}): CandleDto {
  return {
    timestamp: candle.timestamp.getTime(),
    open: candle.open.toNumber(),
    high: candle.high.toNumber(),
    low: candle.low.toNumber(),
    close: candle.close.toNumber(),
    volume: candle.volume.toNumber(),
  };
}

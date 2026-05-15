import { FastifyInstance } from "fastify";
import { MarketRankType } from "@prisma/client";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";

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

const topMarketsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(20),
  refresh: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export async function registerMarketRoutes(app: FastifyInstance) {
  app.get("/api/markets/top", async (request, reply) => {
    const query = topMarketsQuerySchema.parse(request.query);

    try {
      const existing = query.refresh ? [] : await findStoredMarkets(query.limit);
      if (existing.length >= query.limit) {
        return { markets: existing.slice(0, query.limit), source: "database" };
      }

      const markets = await fetchTopTradeVolumeMarkets(query.limit);
      await upsertMarkets(markets);
      return { markets, source: "upbit" };
    } catch (error) {
      app.log.error(error);

      const fallback = await safeFindStoredMarkets(query.limit);
      if (fallback.length > 0) {
        return { markets: fallback, source: "database-fallback" };
      }

      return reply.code(503).send({
        message: "종목 목록을 조회할 수 없습니다.",
      });
    }
  });
}

async function findStoredMarkets(limit: number) {
  const rows = await prisma.market.findMany({
    where: { isActive: true },
    orderBy: [{ rank: "asc" }, { market: "asc" }],
    take: limit,
  });

  return rows.map((row) => ({
    symbol: row.market,
    koreanName: row.koreanName,
    englishName: row.englishName,
    marketCap: 0,
    rank: row.rank ?? 9999,
  }));
}

async function safeFindStoredMarkets(limit: number) {
  try {
    return await findStoredMarkets(limit);
  } catch {
    return [];
  }
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
        marketCap: 0,
        rank: 0,
        tradePrice24h: ticker?.acc_trade_price_24h ?? ticker?.acc_trade_price ?? 0,
      };
    })
    .sort((a, b) => b.tradePrice24h - a.tradePrice24h)
    .slice(0, limit)
    .map((market, index) => ({
      symbol: market.symbol,
      koreanName: market.koreanName,
      englishName: market.englishName,
      marketCap: market.marketCap,
      rank: index + 1,
    }));
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
  const chunks = chunk(markets, 100);
  const tickers: UpbitTicker[] = [];

  for (const marketChunk of chunks) {
    const params = new URLSearchParams({ markets: marketChunk.join(",") });
    const response = await fetch(`${config.UPBIT_API_BASE_URL}/ticker?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Upbit ticker API failed: ${response.status}`);
    }

    tickers.push(...((await response.json()) as UpbitTicker[]));
  }

  return tickers;
}

async function upsertMarkets(markets: Array<{ symbol: string; koreanName: string; englishName: string; rank: number }>) {
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
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

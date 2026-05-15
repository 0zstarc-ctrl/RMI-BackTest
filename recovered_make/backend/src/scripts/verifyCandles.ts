import { CandleInterval } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db.js";

interface UpbitCandle {
  candle_date_time_utc: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
}

type IntervalInput = "1h" | "4h" | "1d";

const market = process.env.VERIFY_CANDLE_MARKET ?? "KRW-BTC";
const interval = parseInterval(process.env.VERIFY_CANDLE_INTERVAL ?? "1d");
const defaultTo = new Date();
const defaultFrom = new Date(defaultTo.getTime() - getIntervalMs(interval) * 10);
const from = process.env.VERIFY_CANDLE_FROM ? new Date(process.env.VERIFY_CANDLE_FROM) : defaultFrom;
const to = process.env.VERIFY_CANDLE_TO ? new Date(process.env.VERIFY_CANDLE_TO) : defaultTo;
const tolerance = Number(process.env.VERIFY_CANDLE_TOLERANCE ?? "0.00000001");

async function main() {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    throw new Error("Invalid verify range. Use ISO dates, and make VERIFY_CANDLE_FROM earlier than VERIFY_CANDLE_TO.");
  }

  console.log("Candle price verification started.");
  console.log(`target market=${market}, interval=${interval}, from=${from.toISOString()}, to=${to.toISOString()}`);

  const [dbCandles, upbitCandles] = await Promise.all([
    loadDatabaseCandles(),
    loadUpbitCandles(),
  ]);

  if (dbCandles.length === 0) {
    throw new Error("No matching DB candles found. Run /api/candles or sync:candles:initial first.");
  }

  if (upbitCandles.length === 0) {
    throw new Error("No matching Upbit candles found for the requested range.");
  }

  const upbitByTimestamp = new Map(
    upbitCandles.map((candle) => [new Date(`${candle.candle_date_time_utc}Z`).getTime(), candle])
  );

  let matched = 0;
  const mismatches: string[] = [];
  const missingInUpbit: string[] = [];

  for (const candle of dbCandles) {
    const upbit = upbitByTimestamp.get(candle.timestamp.getTime());
    if (!upbit) {
      missingInUpbit.push(candle.timestamp.toISOString());
      continue;
    }

    matched += 1;
    compareNumber(mismatches, candle.timestamp, "open", candle.open.toNumber(), upbit.opening_price);
    compareNumber(mismatches, candle.timestamp, "high", candle.high.toNumber(), upbit.high_price);
    compareNumber(mismatches, candle.timestamp, "low", candle.low.toNumber(), upbit.low_price);
    compareNumber(mismatches, candle.timestamp, "close", candle.close.toNumber(), upbit.trade_price);
    compareNumber(mismatches, candle.timestamp, "volume", candle.volume.toNumber(), upbit.candle_acc_trade_volume);
  }

  console.log(`[ok] db candles=${dbCandles.length}, upbit candles=${upbitCandles.length}, matched=${matched}`);

  if (missingInUpbit.length > 0) {
    console.warn(`[warn] DB candles missing in Upbit response=${missingInUpbit.length}`);
    for (const timestamp of missingInUpbit.slice(0, 5)) {
      console.warn(`  missing timestamp=${timestamp}`);
    }
  }

  if (mismatches.length > 0) {
    console.error(`[fail] candle value mismatches=${mismatches.length}`);
    for (const mismatch of mismatches.slice(0, 20)) {
      console.error(`  ${mismatch}`);
    }
    throw new Error("Candle verification failed.");
  }

  console.log("[ok] DB candle prices match Upbit original data.");
  console.log("Candle price verification completed.");
}

async function loadDatabaseCandles() {
  return prisma.candle.findMany({
    where: {
      market,
      interval: toPrismaInterval(interval),
      timestamp: {
        gte: from,
        lte: to,
      },
    },
    orderBy: { timestamp: "asc" },
  });
}

async function loadUpbitCandles() {
  const candles: UpbitCandle[] = [];
  // Upbit's `to` cursor is exclusive around exact candle boundaries, so start
  // one interval after the requested end to include the final requested candle.
  let cursor = new Date(to.getTime() + getIntervalMs(interval));

  for (let page = 0; page < 20; page += 1) {
    const batch = await fetchUpbitCandlePage(cursor);
    if (batch.length === 0) break;

    candles.push(...batch);

    const oldest = new Date(`${batch[batch.length - 1].candle_date_time_utc}Z`);
    if (oldest <= from) break;

    cursor = new Date(oldest.getTime() - 1);
  }

  return dedupeCandles(candles)
    .filter((candle) => {
      const timestamp = new Date(`${candle.candle_date_time_utc}Z`);
      return timestamp >= from && timestamp <= to;
    })
    .sort((a, b) => {
      return new Date(`${a.candle_date_time_utc}Z`).getTime() - new Date(`${b.candle_date_time_utc}Z`).getTime();
    });
}

async function fetchUpbitCandlePage(cursor: Date) {
  const endpoint = interval === "1h" ? "candles/minutes/60" : interval === "4h" ? "candles/minutes/240" : "candles/days";
  const params = new URLSearchParams({
    market,
    to: cursor.toISOString(),
    count: "200",
  });

  const response = await fetch(`${config.UPBIT_API_BASE_URL}/${endpoint}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Upbit candle API failed: ${response.status}`);
  }

  return (await response.json()) as UpbitCandle[];
}

function dedupeCandles(candles: UpbitCandle[]) {
  const byTimestamp = new Map<string, UpbitCandle>();
  for (const candle of candles) {
    byTimestamp.set(candle.candle_date_time_utc, candle);
  }
  return Array.from(byTimestamp.values());
}

function compareNumber(mismatches: string[], timestamp: Date, field: string, dbValue: number, upbitValue: number) {
  if (Math.abs(dbValue - upbitValue) <= tolerance) return;

  mismatches.push(
    `${timestamp.toISOString()} ${field}: db=${dbValue}, upbit=${upbitValue}, diff=${dbValue - upbitValue}`
  );
}

function parseInterval(value: string): IntervalInput {
  if (value === "1h" || value === "4h" || value === "1d") return value;
  throw new Error("VERIFY_CANDLE_INTERVAL must be one of 1h, 4h, 1d.");
}

function toPrismaInterval(value: IntervalInput) {
  if (value === "1h") return CandleInterval.ONE_HOUR;
  if (value === "4h") return CandleInterval.FOUR_HOUR;
  return CandleInterval.ONE_DAY;
}

function getIntervalMs(value: IntervalInput) {
  if (value === "1h") return 60 * 60 * 1000;
  if (value === "4h") return 4 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

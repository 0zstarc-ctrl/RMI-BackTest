import { CandleInterval, SyncJobStatus } from "@prisma/client";
import { prisma } from "../db.js";

async function main() {
  console.log("Operational verification started.");

  await verifyDatabaseConnection();
  await verifyTables();
  await verifyMarketData();
  await verifyCandleData();
  await verifySyncJobs();

  console.log("Operational verification completed.");
}

async function verifyDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("[ok] database connection");
}

async function verifyTables() {
  const [marketCount, candleCount, syncJobCount] = await Promise.all([
    prisma.market.count(),
    prisma.candle.count(),
    prisma.candleSyncJob.count(),
  ]);

  console.log(`[ok] tables reachable: markets=${marketCount}, candles=${candleCount}, syncJobs=${syncJobCount}`);
}

async function verifyMarketData() {
  const markets = await prisma.market.findMany({
    where: { isActive: true },
    orderBy: [{ rank: "asc" }, { market: "asc" }],
    take: 5,
  });

  if (markets.length === 0) {
    console.warn("[warn] no active markets found. Run /api/markets/top or sync:candles:initial first.");
    return;
  }

  console.log(`[ok] active markets sample: ${markets.map((market) => market.market).join(", ")}`);
}

async function verifyCandleData() {
  const grouped = await prisma.candle.groupBy({
    by: ["interval"],
    _count: { _all: true },
  });

  if (grouped.length === 0) {
    console.warn("[warn] no candles found. Run /api/candles or sync:candles:initial first.");
    return;
  }

  for (const row of grouped) {
    console.log(`[ok] candles ${formatInterval(row.interval)}=${row._count._all}`);
  }

  const duplicateCheck = await prisma.$queryRaw<Array<{ duplicate_count: bigint }>>`
    SELECT COUNT(*)::bigint AS duplicate_count
    FROM (
      SELECT market, interval, timestamp
      FROM candles
      GROUP BY market, interval, timestamp
      HAVING COUNT(*) > 1
    ) duplicates
  `;

  const duplicateCount = Number(duplicateCheck[0]?.duplicate_count ?? 0);
  if (duplicateCount > 0) {
    throw new Error(`duplicate candles detected: ${duplicateCount}`);
  }

  console.log("[ok] no duplicate candles");
}

async function verifySyncJobs() {
  const grouped = await prisma.candleSyncJob.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  if (grouped.length === 0) {
    console.warn("[warn] no sync jobs found. This is expected before initial sync.");
    return;
  }

  for (const row of grouped) {
    console.log(`[ok] sync jobs ${row.status}=${row._count._all}`);
  }

  const failed = grouped.find((row) => row.status === SyncJobStatus.FAILED)?._count._all ?? 0;
  if (failed > 0) {
    console.warn(`[warn] failed sync jobs exist: ${failed}`);
  }

  const staleRunningJobs = await prisma.candleSyncJob.findMany({
    where: {
      status: SyncJobStatus.RUNNING,
      updatedAt: {
        lt: new Date(Date.now() - 60 * 60 * 1000),
      },
    },
    orderBy: { updatedAt: "asc" },
    take: 5,
  });

  if (staleRunningJobs.length > 0) {
    console.warn(`[warn] stale running sync jobs exist: ${staleRunningJobs.length}`);
    for (const job of staleRunningJobs) {
      console.warn(`[warn] stale job ${job.market} ${formatInterval(job.interval)} updatedAt=${job.updatedAt.toISOString()}`);
    }
  }
}

function formatInterval(interval: CandleInterval) {
  if (interval === CandleInterval.ONE_HOUR) return "1h";
  if (interval === CandleInterval.FOUR_HOUR) return "4h";
  return "1d";
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

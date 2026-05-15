-- CreateEnum
CREATE TYPE "CandleInterval" AS ENUM ('ONE_HOUR', 'FOUR_HOUR', 'ONE_DAY');

-- CreateEnum
CREATE TYPE "MarketRankType" AS ENUM ('MARKET_CAP', 'TRADE_VOLUME', 'MANUAL');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "markets" (
    "id" BIGSERIAL NOT NULL,
    "market" TEXT NOT NULL,
    "korean_name" TEXT NOT NULL,
    "english_name" TEXT NOT NULL,
    "rank" INTEGER,
    "rank_type" "MarketRankType" NOT NULL DEFAULT 'TRADE_VOLUME',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candles" (
    "id" BIGSERIAL NOT NULL,
    "market" TEXT NOT NULL,
    "interval" "CandleInterval" NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "open" DECIMAL(28,10) NOT NULL,
    "high" DECIMAL(28,10) NOT NULL,
    "low" DECIMAL(28,10) NOT NULL,
    "close" DECIMAL(28,10) NOT NULL,
    "volume" DECIMAL(28,10) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'upbit',
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "candles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candle_sync_jobs" (
    "id" BIGSERIAL NOT NULL,
    "market" TEXT NOT NULL,
    "interval" "CandleInterval" NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "last_synced_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "candle_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_market_key" ON "markets"("market");

-- CreateIndex
CREATE INDEX "candles_market_interval_timestamp_idx" ON "candles"("market", "interval", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "candles_market_interval_timestamp_key" ON "candles"("market", "interval", "timestamp");

-- CreateIndex
CREATE INDEX "candle_sync_jobs_status_idx" ON "candle_sync_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "candle_sync_jobs_market_interval_key" ON "candle_sync_jobs"("market", "interval");

-- AddForeignKey
ALTER TABLE "candles" ADD CONSTRAINT "candles_market_fkey" FOREIGN KEY ("market") REFERENCES "markets"("market") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candle_sync_jobs" ADD CONSTRAINT "candle_sync_jobs_market_fkey" FOREIGN KEY ("market") REFERENCES "markets"("market") ON DELETE CASCADE ON UPDATE CASCADE;

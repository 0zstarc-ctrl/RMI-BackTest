import { describe, expect, it } from "vitest";
import { BacktestConfig, runBacktest } from "./backtest";
import { createCandles } from "./testFixtures";

const baseConfig: BacktestConfig = {
  symbol: "KRW-BTC",
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  endDate: new Date("2026-01-10T00:00:00.000Z"),
  interval: "1d",
  rmi: {
    period: 2,
    momentum: 1,
    overbought: 70,
    oversold: 30,
  },
  buyCondition: 30,
  buySignalType: "break",
  sellCondition: 70,
  sellSignalType: "enter",
  stopLoss: 50,
  slippage: 0,
  fee: 0,
  initialCapital: 1000,
};

describe("runBacktest", () => {
  it("buys and sells from RMI signals using the close price when costs are zero", () => {
    const candles = createCandles([100, 90, 80, 70, 90, 110]);
    const result = runBacktest(candles, baseConfig);

    expect(result.trades).toHaveLength(2);
    expect(result.trades[0]).toMatchObject({
      type: "BUY",
      timestamp: candles[4].timestamp,
      price: 90,
      reason: "RMI 매수",
    });
    expect(result.trades[0].amount).toBeCloseTo(1000 / 90, 8);

    expect(result.trades[1]).toMatchObject({
      type: "SELL",
      timestamp: candles[5].timestamp,
      price: 110,
      reason: "RMI 매도",
    });
    expect(result.trades[1].pnl).toBeCloseTo((1000 / 90) * 110 - 1000, 8);
    expect(result.finalCapital).toBeCloseTo((1000 / 90) * 110, 8);
  });

  it("applies buy fee, sell fee, and slippage to trade prices and final capital", () => {
    const candles = createCandles([100, 90, 80, 70, 90, 110]);
    const result = runBacktest(candles, {
      ...baseConfig,
      fee: 1,
      slippage: 10,
    });

    expect(result.trades[0].price).toBeCloseTo(99, 8);
    expect(result.trades[0].amount).toBeCloseTo(10, 8);
    expect(result.trades[1].price).toBeCloseTo(99, 8);
    expect(result.finalCapital).toBeCloseTo(980.1, 8);
  });

  it("prioritizes stop loss over an RMI sell signal on the same candle", () => {
    const candles = createCandles([100, 90, 80, 70, 90, 50]);
    const result = runBacktest(candles, {
      ...baseConfig,
      sellCondition: 60,
      sellSignalType: "break",
      stopLoss: 10,
    });

    expect(result.trades).toHaveLength(2);
    expect(result.trades[1]).toMatchObject({
      type: "SELL",
      timestamp: candles[5].timestamp,
      price: 50,
      reason: "손절",
    });
  });

  it("does not sell when there is no open position", () => {
    const candles = createCandles([100, 110, 120, 130, 110]);
    const result = runBacktest(candles, {
      ...baseConfig,
      buyCondition: 1,
      sellCondition: 70,
      sellSignalType: "break",
    });

    expect(result.trades).toHaveLength(0);
  });

  it("keeps a single position and ignores additional buy signals while holding", () => {
    const candles = createCandles([100, 90, 80, 70, 90, 60, 90]);
    const result = runBacktest(candles, {
      ...baseConfig,
      buyCondition: 45,
      sellCondition: 101,
      sellSignalType: "enter",
      stopLoss: 100,
    });

    const buyTrades = result.trades.filter((trade) => trade.type === "BUY");
    expect(buyTrades).toHaveLength(1);
    expect(result.trades).toHaveLength(1);
    expect(result.finalCapital).toBeCloseTo(1000, 8);
  });

  it("marks an open position to market on the last candle without creating realized pnl", () => {
    const candles = createCandles([100, 90, 80, 70, 90, 95]);
    const result = runBacktest(candles, {
      ...baseConfig,
      sellCondition: 101,
      sellSignalType: "enter",
    });

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].type).toBe("BUY");
    expect(result.trades[0].pnl).toBeUndefined();
    expect(result.finalCapital).toBeCloseTo((1000 / 90) * 95, 8);
  });
});

import { describe, expect, it } from "vitest";
import {
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateTotalReturn,
  calculateTotalReturnPercent,
  calculateTradeStats,
  calculateWinRate,
} from "./performance";
import { Trade } from "./backtest";

describe("performance metrics", () => {
  it("calculates total return and total return percent", () => {
    expect(calculateTotalReturn(1200, 1000)).toBe(200);
    expect(calculateTotalReturnPercent(1200, 1000)).toBe(20);
  });

  it("returns zero percent return when initial capital is invalid", () => {
    expect(calculateTotalReturnPercent(1200, 0)).toBe(0);
  });

  it("calculates trade stats from closed sell trades only", () => {
    const trades: Trade[] = [
      { type: "BUY", timestamp: 1, price: 100, amount: 1, reason: "RMI 매수", rmi: 30 },
      { type: "SELL", timestamp: 2, price: 110, amount: 1, reason: "RMI 매도", rmi: 70, pnl: 10 },
      { type: "BUY", timestamp: 3, price: 100, amount: 1, reason: "RMI 매수", rmi: 30 },
      { type: "SELL", timestamp: 4, price: 90, amount: 1, reason: "손절", rmi: 20, pnl: -10 },
    ];

    expect(calculateTradeStats(trades)).toEqual({
      numberOfTrades: 4,
      winningTrades: 1,
      losingTrades: 1,
      winRate: 50,
    });
  });

  it("returns zero win rate when there are no closed trades", () => {
    expect(calculateWinRate(0, 0)).toBe(0);
    expect(calculateTradeStats([]).winRate).toBe(0);
  });

  it("calculates max drawdown from an equity curve", () => {
    expect(calculateMaxDrawdown([100, 120, 90, 150])).toBe(25);
  });

  it("returns zero max drawdown for empty or non-declining equity", () => {
    expect(calculateMaxDrawdown([])).toBe(0);
    expect(calculateMaxDrawdown([100, 110, 120])).toBe(0);
  });

  it("returns zero sharpe ratio when there is not enough variance", () => {
    expect(calculateSharpeRatio([])).toBe(0);
    expect(calculateSharpeRatio([100])).toBe(0);
    expect(calculateSharpeRatio([100, 100, 100])).toBe(0);
  });

  it("calculates a deterministic sharpe ratio with an explicit annualization factor", () => {
    expect(calculateSharpeRatio([100, 110, 99], 1)).toBeCloseTo(0, 8);
  });
});

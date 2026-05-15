import { Trade } from "./backtest";

export interface TradeStats {
  numberOfTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
}

export function calculateTotalReturn(finalCapital: number, initialCapital: number) {
  return finalCapital - initialCapital;
}

export function calculateTotalReturnPercent(finalCapital: number, initialCapital: number) {
  if (initialCapital <= 0) return 0;
  return (calculateTotalReturn(finalCapital, initialCapital) / initialCapital) * 100;
}

export function calculateTradeStats(trades: Trade[]): TradeStats {
  const sellTrades = trades.filter((trade) => trade.type === "SELL");
  const winningTrades = sellTrades.filter((trade) => (trade.pnl ?? 0) > 0).length;
  const losingTrades = sellTrades.length - winningTrades;

  return {
    numberOfTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate: calculateWinRate(winningTrades, sellTrades.length),
  };
}

export function calculateWinRate(winningTrades: number, closedTrades: number) {
  if (closedTrades <= 0) return 0;
  return (winningTrades / closedTrades) * 100;
}

export function calculateMaxDrawdown(equity: number[]) {
  let peak = equity[0] ?? 0;
  let maxDrawdown = 0;

  for (const value of equity) {
    peak = Math.max(peak, value);
    if (peak > 0) {
      maxDrawdown = Math.max(maxDrawdown, ((peak - value) / peak) * 100);
    }
  }

  return maxDrawdown;
}

export function calculateSharpeRatio(equity: number[], annualizationFactor = 252) {
  if (equity.length < 2) return 0;

  const returns = equity.slice(1).map((value, index) => {
    const previous = equity[index];
    return previous === 0 ? 0 : (value - previous) / previous;
  });
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev === 0 ? 0 : (average / stdDev) * Math.sqrt(annualizationFactor);
}

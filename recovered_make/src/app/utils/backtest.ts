import {
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateTotalReturn,
  calculateTotalReturnPercent,
  calculateTradeStats,
} from "./performance";
import { CandleData, RMIConfig, calculateRMI } from "./rmi";

export type SignalType = "enter" | "break";
export type CandleInterval = "1h" | "4h" | "1d";

export interface BacktestConfig {
  symbol: string;
  startDate: Date;
  endDate: Date;
  interval: CandleInterval;
  rmi: RMIConfig;
  buyCondition: number;
  buySignalType: SignalType;
  sellCondition: number;
  sellSignalType: SignalType;
  stopLoss: number;
  slippage: number;
  fee: number;
  initialCapital: number;
}

export interface Trade {
  type: "BUY" | "SELL";
  timestamp: number;
  price: number;
  amount: number;
  reason: string;
  rmi: number;
  pnl?: number;
}

export interface BacktestResult {
  trades: Trade[];
  equity: number[];
  timestamps: number[];
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  numberOfTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  config: BacktestConfig;
  candleData: CandleData[];
  rmiValues: number[];
}

export function runBacktest(candleData: CandleData[], config: BacktestConfig): BacktestResult {
  const rmiValues = calculateRMI(candleData, config.rmi.period, config.rmi.momentum);
  const trades: Trade[] = [];
  const equity: number[] = [];
  const timestamps: number[] = [];

  let cash = config.initialCapital;
  let position = 0;
  let entryPrice = 0;

  for (let i = 1; i < candleData.length; i++) {
    const candle = candleData[i];
    const prevRmi = rmiValues[i - 1];
    const currentRmi = rmiValues[i];
    let didStopLoss = false;

    if (position > 0 && entryPrice > 0) {
      const lossPercent = ((entryPrice - candle.close) / entryPrice) * 100;
      if (lossPercent >= config.stopLoss) {
        const sell = sellPosition(position, candle.close, config);
        cash += sell.cashReceived;
        trades.push({
          type: "SELL",
          timestamp: candle.timestamp,
          price: sell.price,
          amount: position,
          reason: "손절",
          rmi: currentRmi,
          pnl: sell.cashReceived - position * entryPrice,
        });
        position = 0;
        entryPrice = 0;
        didStopLoss = true;
      }
    }

    if (!didStopLoss && position === 0 && isBuySignal(prevRmi, currentRmi, config)) {
      const buyPrice = candle.close * (1 + config.slippage / 100);
      const feeAmount = cash * (config.fee / 100);
      position = (cash - feeAmount) / buyPrice;
      entryPrice = buyPrice;
      cash = 0;
      trades.push({
        type: "BUY",
        timestamp: candle.timestamp,
        price: buyPrice,
        amount: position,
        reason: "RMI 매수",
        rmi: currentRmi,
      });
    } else if (!didStopLoss && position > 0 && isSellSignal(prevRmi, currentRmi, config)) {
      const sell = sellPosition(position, candle.close, config);
      cash += sell.cashReceived;
      trades.push({
        type: "SELL",
        timestamp: candle.timestamp,
        price: sell.price,
        amount: position,
        reason: "RMI 매도",
        rmi: currentRmi,
        pnl: sell.cashReceived - position * entryPrice,
      });
      position = 0;
      entryPrice = 0;
    }

    equity.push(cash + position * candle.close);
    timestamps.push(candle.timestamp);
  }

  const lastCandle = candleData[candleData.length - 1];
  const finalCapital = cash + position * (lastCandle?.close ?? 0);
  const totalReturn = calculateTotalReturn(finalCapital, config.initialCapital);
  const tradeStats = calculateTradeStats(trades);

  return {
    trades,
    equity,
    timestamps,
    finalCapital,
    totalReturn,
    totalReturnPercent: calculateTotalReturnPercent(finalCapital, config.initialCapital),
    numberOfTrades: tradeStats.numberOfTrades,
    winningTrades: tradeStats.winningTrades,
    losingTrades: tradeStats.losingTrades,
    winRate: tradeStats.winRate,
    maxDrawdown: calculateMaxDrawdown(equity),
    sharpeRatio: calculateSharpeRatio(equity),
    config,
    candleData,
    rmiValues,
  };
}

function isBuySignal(prevRmi: number, currentRmi: number, config: BacktestConfig) {
  if (config.buySignalType === "enter") {
    return prevRmi > config.buyCondition && currentRmi <= config.buyCondition;
  }
  return prevRmi <= config.buyCondition && currentRmi > config.buyCondition;
}

function isSellSignal(prevRmi: number, currentRmi: number, config: BacktestConfig) {
  if (config.sellSignalType === "enter") {
    return prevRmi < config.sellCondition && currentRmi >= config.sellCondition;
  }
  return prevRmi >= config.sellCondition && currentRmi < config.sellCondition;
}

function sellPosition(position: number, close: number, config: BacktestConfig) {
  const price = close * (1 - config.slippage / 100);
  const gross = position * price;
  const fee = gross * (config.fee / 100);
  return { price, cashReceived: gross - fee };
}

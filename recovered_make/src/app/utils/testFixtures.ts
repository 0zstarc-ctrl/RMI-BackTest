import { CandleData } from "./rmi";

export function createCandles(closes: number[], startTimestamp = Date.UTC(2026, 0, 1)): CandleData[] {
  return closes.map((close, index) => ({
    timestamp: startTimestamp + index * 24 * 60 * 60 * 1000,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  }));
}

export const risingCandles = createCandles([100, 101, 102, 103, 104, 105, 106, 107]);
export const fallingCandles = createCandles([107, 106, 105, 104, 103, 102, 101, 100]);
export const flatCandles = createCandles([100, 100, 100, 100, 100, 100, 100, 100]);
export const mixedCandles = createCandles([100, 104, 101, 105, 102, 106, 103, 107]);

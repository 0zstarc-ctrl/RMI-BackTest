// RMI (Relative Momentum Index) Calculation
export interface RMIConfig {
  period: number;
  momentum: number;
  overbought: number;
  oversold: number;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function calculateRMI(
  data: CandleData[],
  period: number = 20,
  momentum: number = 5
): number[] {
  validateRmiInputs(data, period, momentum);

  const rmiValues: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < momentum + period) {
      rmiValues.push(50);
      continue;
    }

    const upMoves: number[] = [];
    const downMoves: number[] = [];

    for (let j = i - period + 1; j <= i; j++) {
      if (j >= momentum) {
        const change = data[j].close - data[j - momentum].close;
        if (change > 0) {
          upMoves.push(change);
          downMoves.push(0);
        } else {
          upMoves.push(0);
          downMoves.push(Math.abs(change));
        }
      }
    }

    // Calculate average gains and losses
    const avgUp = upMoves.reduce((a, b) => a + b, 0) / period;
    const avgDown = downMoves.reduce((a, b) => a + b, 0) / period;

    rmiValues.push(calculateRmiValue(avgUp, avgDown));
  }

  return rmiValues;
}

function calculateRmiValue(avgUp: number, avgDown: number) {
  if (avgUp === 0 && avgDown === 0) return 50;
  if (avgDown === 0) return 100;
  if (avgUp === 0) return 0;

  const rs = avgUp / avgDown;
  return 100 - 100 / (1 + rs);
}

function validateRmiInputs(data: CandleData[], period: number, momentum: number) {
  if (!Number.isInteger(period) || period < 2) {
    throw new RangeError("RMI period must be an integer greater than or equal to 2.");
  }

  if (!Number.isInteger(momentum) || momentum < 1) {
    throw new RangeError("RMI momentum must be an integer greater than or equal to 1.");
  }

  const invalidCandle = data.find((candle) => !Number.isFinite(candle.close) || candle.close <= 0);
  if (invalidCandle) {
    throw new RangeError("Candle close prices must be positive finite numbers.");
  }
}

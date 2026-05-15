import type { BacktestConfig, BacktestResult, CandleInterval, SignalType } from "./backtest";

const SETTINGS_KEY = "rmi-backtest:last-settings";
const RESULT_KEY = "rmi-backtest:last-result";

export interface BacktestFormState {
  selectedSymbol: string;
  interval: CandleInterval;
  startDate: string;
  endDate: string;
  rmiPeriod: number;
  rmiMomentum: number;
  overbought: number;
  oversold: number;
  buyCondition: number;
  buySignalType: SignalType;
  sellCondition: number;
  sellSignalType: SignalType;
  stopLoss: number;
  slippage: number;
  fee: number;
  initialCapital: number;
}

interface StoredBacktestResult extends Omit<BacktestResult, "config"> {
  config: Omit<BacktestConfig, "startDate" | "endDate"> & {
    startDate: string;
    endDate: string;
  };
}

export function saveLastBacktestSettings(settings: BacktestFormState) {
  writeJson(SETTINGS_KEY, settings);
}

export function loadLastBacktestSettings() {
  return readJson<BacktestFormState>(SETTINGS_KEY);
}

export function saveLastBacktestResult(result: BacktestResult) {
  const stored: StoredBacktestResult = {
    ...result,
    config: {
      ...result.config,
      startDate: result.config.startDate.toISOString(),
      endDate: result.config.endDate.toISOString(),
    },
  };

  writeJson(RESULT_KEY, stored);
}

export function loadLastBacktestResult(): BacktestResult | null {
  const stored = readJson<StoredBacktestResult>(RESULT_KEY);
  if (!stored) return null;

  return {
    ...stored,
    config: {
      ...stored.config,
      startDate: new Date(stored.config.startDate),
      endDate: new Date(stored.config.endDate),
    },
  };
}

function readJson<T>(key: string): T | null {
  try {
    if (!isStorageAvailable()) return null;

    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    if (!isStorageAvailable()) return;

    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is a convenience feature; backtesting should still work if storage is unavailable.
  }
}

function isStorageAvailable() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

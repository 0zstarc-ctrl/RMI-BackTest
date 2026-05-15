import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BacktestFormState,
  loadLastBacktestResult,
  loadLastBacktestSettings,
  saveLastBacktestResult,
  saveLastBacktestSettings,
} from "./persistence";
import { BacktestResult } from "./backtest";

const storage = new Map<string, string>();

vi.stubGlobal("window", {
  localStorage: {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  },
});

afterEach(() => {
  storage.clear();
  vi.clearAllMocks();
});

describe("backtest persistence", () => {
  it("saves and loads the last form settings", () => {
    const settings: BacktestFormState = {
      selectedSymbol: "KRW-BTC",
      interval: "1d",
      startDate: "2026-04-15",
      endDate: "2026-05-15",
      rmiPeriod: 20,
      rmiMomentum: 5,
      overbought: 70,
      oversold: 30,
      buyCondition: 30,
      buySignalType: "break",
      sellCondition: 70,
      sellSignalType: "break",
      stopLoss: 5,
      slippage: 0.1,
      fee: 0.05,
      initialCapital: 10000000,
    };

    saveLastBacktestSettings(settings);

    expect(loadLastBacktestSettings()).toEqual(settings);
  });

  it("saves and restores result config dates as Date instances", () => {
    const result: BacktestResult = {
      trades: [],
      equity: [1000],
      timestamps: [1],
      finalCapital: 1000,
      totalReturn: 0,
      totalReturnPercent: 0,
      numberOfTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      config: {
        symbol: "KRW-BTC",
        startDate: new Date("2026-04-14T15:00:00.000Z"),
        endDate: new Date("2026-05-15T14:59:59.999Z"),
        interval: "1d",
        rmi: { period: 20, momentum: 5, overbought: 70, oversold: 30 },
        buyCondition: 30,
        buySignalType: "break",
        sellCondition: 70,
        sellSignalType: "break",
        stopLoss: 5,
        slippage: 0.1,
        fee: 0.05,
        initialCapital: 10000000,
      },
      candleData: [],
      rmiValues: [],
    };

    saveLastBacktestResult(result);
    const restored = loadLastBacktestResult();

    expect(restored?.config.startDate).toBeInstanceOf(Date);
    expect(restored?.config.startDate.toISOString()).toBe("2026-04-14T15:00:00.000Z");
    expect(restored?.config.endDate).toBeInstanceOf(Date);
    expect(restored?.config.endDate.toISOString()).toBe("2026-05-15T14:59:59.999Z");
  });
});

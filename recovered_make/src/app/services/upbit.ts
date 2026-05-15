import { CandleData } from "../utils/rmi";
import { CandleInterval } from "../utils/backtest";

export interface Coin {
  symbol: string;
  koreanName: string;
  englishName: string;
  marketCap: number;
  rank: number;
}

interface MarketsTopResponse {
  markets: Coin[];
  source: "database" | "upbit" | "database-fallback";
}

interface CandlesResponse {
  candles: CandleData[];
  source: "database" | "upbit";
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";

export async function getTopCoins(limit = 20): Promise<Coin[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/api/markets/top?${params.toString()}`);

  if (!response.ok) {
    throw new Error("종목 목록을 불러오지 못했습니다.");
  }

  const data = (await response.json()) as MarketsTopResponse;
  return data.markets;
}

export async function fetchCandleData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  interval: CandleInterval = "1d"
): Promise<CandleData[]> {
  const params = new URLSearchParams({
    market: symbol,
    interval,
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  });
  const response = await fetch(`${API_BASE_URL}/api/candles?${params.toString()}`);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || "캔들 데이터를 불러오지 못했습니다.");
  }

  const data = (await response.json()) as CandlesResponse;
  return data.candles;
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message;
  } catch {
    return "";
  }
}

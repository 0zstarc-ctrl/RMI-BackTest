import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCandleData } from "./upbit";
import { dateInputToKstEndDate, dateInputToKstStartDate } from "../utils/time";

describe("fetchCandleData", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends KST-derived UTC ISO date boundaries to the backend candle API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ candles: [], source: "database" }),
    } as Response);

    const start = dateInputToKstStartDate("2026-05-01");
    const end = dateInputToKstEndDate("2026-05-02");

    await fetchCandleData("KRW-BTC", start, end, "1h");

    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestUrl.pathname).toBe("/api/candles");
    expect(requestUrl.searchParams.get("market")).toBe("KRW-BTC");
    expect(requestUrl.searchParams.get("interval")).toBe("1h");
    expect(requestUrl.searchParams.get("from")).toBe("2026-04-30T15:00:00.000Z");
    expect(requestUrl.searchParams.get("to")).toBe("2026-05-02T14:59:59.999Z");
  });
});

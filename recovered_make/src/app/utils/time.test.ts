import { describe, expect, it } from "vitest";
import {
  addMonthsToDateInput,
  dateInputToKstEndDate,
  dateInputToKstStartDate,
  formatKstDate,
  formatKstDateTime,
  formatKstMonthDay,
} from "./time";

describe("KST date utilities", () => {
  it("converts a date input to the KST day start in UTC", () => {
    expect(dateInputToKstStartDate("2026-05-01").toISOString()).toBe("2026-04-30T15:00:00.000Z");
  });

  it("converts a date input to the KST day end in UTC", () => {
    expect(dateInputToKstEndDate("2026-05-01").toISOString()).toBe("2026-05-01T14:59:59.999Z");
  });

  it("converts an inclusive KST date range to UTC API boundaries", () => {
    expect(dateInputToKstStartDate("2026-05-01").toISOString()).toBe("2026-04-30T15:00:00.000Z");
    expect(dateInputToKstEndDate("2026-05-02").toISOString()).toBe("2026-05-02T14:59:59.999Z");
  });

  it("formats timestamps in Korea time", () => {
    const timestamp = Date.parse("2026-04-30T15:00:00.000Z");

    expect(formatKstDate(timestamp)).toBe("2026-05-01");
    expect(formatKstMonthDay(timestamp)).toBe("05-01");
    expect(formatKstDateTime(timestamp)).toBe("2026-05-01 00:00");
  });

  it("formats daytime timestamps in Korea time", () => {
    const timestamp = Date.parse("2026-05-01T05:30:00.000Z");

    expect(formatKstDateTime(timestamp)).toBe("2026-05-01 14:30");
  });

  it("subtracts one month from a date input without using the local machine timezone", () => {
    expect(addMonthsToDateInput("2026-05-15", -1)).toBe("2026-04-15");
  });
});

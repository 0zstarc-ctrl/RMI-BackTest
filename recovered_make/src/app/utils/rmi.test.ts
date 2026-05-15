import { describe, expect, it } from "vitest";
import { calculateRMI } from "./rmi";
import { createCandles, fallingCandles, flatCandles, mixedCandles, risingCandles } from "./testFixtures";

describe("calculateRMI", () => {
  it("returns one RMI value per candle", () => {
    expect(calculateRMI(risingCandles, 3, 1)).toHaveLength(risingCandles.length);
  });

  it("uses neutral values before enough data is available", () => {
    expect(calculateRMI(risingCandles, 3, 1).slice(0, 4)).toEqual([50, 50, 50, 50]);
  });

  it("moves high during a consistent rising trend", () => {
    const values = calculateRMI(risingCandles, 3, 1);

    expect(values.at(-1)).toBe(100);
  });

  it("moves low during a consistent falling trend", () => {
    const values = calculateRMI(fallingCandles, 3, 1);

    expect(values.at(-1)).toBe(0);
  });

  it("keeps flat data deterministic", () => {
    const values = calculateRMI(flatCandles, 3, 1);

    expect(values.at(-1)).toBe(50);
  });

  it("calculates a balanced mixed case from average up and down moves", () => {
    const values = calculateRMI(mixedCandles, 3, 1);

    expect(values.at(-1)).toBeCloseTo(72.7272727, 6);
  });

  it("returns an empty array for empty candle data", () => {
    expect(calculateRMI([], 3, 1)).toEqual([]);
  });

  it("rejects invalid period values", () => {
    expect(() => calculateRMI(risingCandles, 1, 1)).toThrow(RangeError);
    expect(() => calculateRMI(risingCandles, 2.5, 1)).toThrow(RangeError);
  });

  it("rejects invalid momentum values", () => {
    expect(() => calculateRMI(risingCandles, 3, 0)).toThrow(RangeError);
    expect(() => calculateRMI(risingCandles, 3, 1.5)).toThrow(RangeError);
  });

  it("rejects non-positive close prices", () => {
    expect(() => calculateRMI(createCandles([100, 0, 101, 102]), 3, 1)).toThrow(RangeError);
  });
});

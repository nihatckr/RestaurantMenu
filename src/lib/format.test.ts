import { describe, expect, it } from "vitest";
import { formatPriceTRY } from "./format";

describe("formatPriceTRY", () => {
  it("formats a number as a TRY price", () => {
    // ₺ is the lira sign; tr-TR groups thousands with a dot.
    expect(formatPriceTRY(250)).toContain("250");
    expect(formatPriceTRY(250)).toContain("₺");
  });

  it("returns empty string for nullish or NaN input", () => {
    expect(formatPriceTRY(null)).toBe("");
    expect(formatPriceTRY(undefined)).toBe("");
    expect(formatPriceTRY(Number.NaN)).toBe("");
  });
});

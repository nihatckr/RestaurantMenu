import { describe, expect, it } from "vitest";
import { formatPriceTRY } from "./format";

describe("formatPriceTRY", () => {
  it("formats a number as a plain grouped price (no currency symbol)", () => {
    // Figma shows plain numbers; tr-TR groups thousands with a dot.
    expect(formatPriceTRY(250)).toBe("250");
    expect(formatPriceTRY(1400)).toBe("1.400");
    // no ₺ sign (brand Mono font lacks the glyph; currency stated in the footer)
    expect(formatPriceTRY(250)).not.toContain("₺");
  });

  it("returns empty string for nullish or NaN input", () => {
    expect(formatPriceTRY(null)).toBe("");
    expect(formatPriceTRY(undefined)).toBe("");
    expect(formatPriceTRY(Number.NaN)).toBe("");
  });
});

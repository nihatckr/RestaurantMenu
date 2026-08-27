import { describe, expect, it } from "vitest";
import { pickLocalized } from "./i18n";

describe("pickLocalized", () => {
  const rows = [
    { locale: "tr", name: "Salatalar" },
    { locale: "en", name: "Salads" },
  ];

  it("returns the requested locale when present", () => {
    expect(pickLocalized(rows, "en")?.name).toBe("Salads");
  });

  it("falls back to tr when the locale is missing", () => {
    expect(pickLocalized(rows, "ru")?.name).toBe("Salatalar");
  });

  it("falls back to the first row when tr is also missing", () => {
    const noTr = [{ locale: "de", name: "Salate" }];
    expect(pickLocalized(noTr, "ru")?.name).toBe("Salate");
  });

  it("returns undefined for an empty list", () => {
    expect(pickLocalized([], "tr")).toBeUndefined();
  });
});

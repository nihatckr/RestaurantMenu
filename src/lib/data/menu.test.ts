import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  getVenueBySlug,
  getVenueMenu,
  listVenueCategories,
  listVenues,
} from "@/lib/data/menu";

// Integration tests against the seeded database (see prisma/seed.ts). They lock
// in the evidenced per-venue behavior so future changes can't silently regress
// it. Require the dev/CI Postgres to be up and seeded.

afterAll(async () => {
  await prisma.$disconnect();
});

const slugs = (rows: { slug: string }[]) => rows.map((r) => r.slug);

describe("data-access: venues & shared catalog", () => {
  it("lists both venues in order", async () => {
    expect(slugs(await listVenues())).toEqual(["terrace", "garden"]);
  });

  it("resolves a known venue and returns null for unknown", async () => {
    expect((await getVenueBySlug("terrace"))?.name).toBe("Mono Terrace");
    expect(await getVenueBySlug("nope")).toBeNull();
    expect(await getVenueMenu("nope")).toBeNull();
  });

  it("shares one product catalog across venues", async () => {
    const titles = (menu: Awaited<ReturnType<typeof getVenueMenu>>) =>
      (menu ?? []).flatMap((c) => c.items.map((i) => i.title));
    expect(titles(await getVenueMenu("terrace"))).toContain("Mono Burger");
    expect(titles(await getVenueMenu("garden"))).toContain("Mono Burger");
  });
});

describe("data-access: per-venue visibility & ordering", () => {
  it("Terrace hides Breakfast; Garden shows it", async () => {
    const terrace = slugs(await listVenueCategories("terrace"));
    const garden = slugs(await listVenueCategories("garden"));
    expect(terrace).not.toContain("breakfast");
    expect(garden).toContain("breakfast");
  });

  it("drink order differs per venue (data-driven)", async () => {
    const terrace = slugs(await listVenueCategories("terrace"));
    const garden = slugs(await listVenueCategories("garden"));
    expect(terrace.indexOf("beers")).toBeLessThan(terrace.indexOf("wines"));
    expect(garden.indexOf("wines")).toBeLessThan(garden.indexOf("beers"));
  });

  it("hidden category has no items in the venue menu", async () => {
    const terrace = await getVenueMenu("terrace");
    expect((terrace ?? []).some((c) => c.slug === "breakfast")).toBe(false);
  });

  it("per-item visibility: a product can be hidden in one venue only", async () => {
    const titles = async (slug: string) =>
      ((await getVenueMenu(slug)) ?? []).flatMap((c) => c.items.map((i) => i.title));
    const terrace = await titles("terrace");
    const garden = await titles("garden");
    // Vegan Wrap: Garden only. Cheeseburger: Terrace only.
    expect(garden).toContain("Vegan Wrap");
    expect(terrace).not.toContain("Vegan Wrap");
    expect(terrace).toContain("Cheeseburger");
    expect(garden).not.toContain("Cheeseburger");
  });
});

describe("data-access: pricing shape", () => {
  it("simple items keep a single price and no measures", async () => {
    const menu = await getVenueMenu("garden");
    const items = (menu ?? []).flatMap((c) => c.items);
    const burger = items.find((i) => i.title === "Mono Burger");
    expect(burger!.prices).toEqual([]);
    expect(burger!.price).not.toBeNull();
  });
  // NOTE: multi-measure (spirits/wine cl) is exercised once real drink data
  // exists; the invented demo drinks were removed. The capability remains in the
  // schema (MenuItemPrice) and rendering.
});

describe("data-access: localization", () => {
  it("localizes category names with tr default and en override", async () => {
    const tr = await listVenueCategories("terrace", "tr");
    const en = await listVenueCategories("terrace", "en");
    expect(tr.find((c) => c.slug === "salads")?.name).toBe("Salatalar");
    expect(en.find((c) => c.slug === "salads")?.name).toBe("Salads");
  });
});

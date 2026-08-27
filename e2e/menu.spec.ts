import { test, expect, type Locator } from "@playwright/test";

// Human-workflow e2e: navigate the public menu the way a guest does and assert
// the layouts/content this session aligned to Figma + the legacy apps. These
// exercise the real rendered pages (not internal functions).

// y-position of each matched element's box — used to prove "N per row".
async function rowYs(cards: Locator): Promise<number[]> {
  return cards.evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().y)),
  );
}

test("landing lists categories, shows brand mark, and navigates into one", async ({
  page,
}) => {
  await page.goto("/terrace");

  // Brand mark (MO/NO) at the top of the landing (exact — the footer wordmark's
  // alt is "Mono Terrace", which would also substring-match "Mono").
  await expect(page.getByRole("img", { name: "Mono", exact: true })).toBeVisible();

  // Bilingual category links are listed.
  const desserts = page.getByRole("link", { name: /Tatlılar/ });
  await expect(page.getByRole("link", { name: /Başlangıçlar/ })).toBeVisible();
  await expect(desserts).toBeVisible();

  // Guest taps a category → lands on its page.
  await desserts.click();
  await expect(page).toHaveURL(/\/terrace\/desserts$/);
  await expect(page.getByRole("heading", { name: "Desserts" })).toBeVisible();
});

test("desserts render two-up (legacy per-category grid)", async ({ page }) => {
  await page.goto("/terrace/desserts");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Desserts" }),
  });
  const cards = section.locator("article");
  await expect(cards).toHaveCount(3);

  // First two cards share a row, the third wraps → exactly 2 columns.
  const ys = await rowYs(cards);
  expect(Math.abs(ys[0] - ys[1])).toBeLessThan(5);
  expect(ys[2]).toBeGreaterThan(ys[0] + 20);
});

test("cocktails render five-up tall tiles", async ({ page }) => {
  await page.goto("/terrace/cocktails");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Cocktails" }),
  });
  await expect(section.getByText("Aperol Spritz")).toBeVisible();

  // 4 cocktails fit one row in a 5-col grid → all share the same y.
  const ys = await rowYs(section.locator("article"));
  expect(ys.length).toBe(4);
  for (const y of ys) expect(Math.abs(y - ys[0])).toBeLessThan(5);
});

test("hard drinks: EN-big/TR-small sub-headers + grouped GLASS/BOTTLE prices", async ({
  page,
}) => {
  await page.goto("/terrace/hard-drinks");

  // Sub-category header is English-primary with the Turkish tag beneath.
  await expect(page.getByRole("heading", { name: "Whisky" })).toBeVisible();
  await expect(page.getByText("Viski", { exact: true })).toBeVisible();

  // Glass-group prices are slash-joined (4 CL / 8 CL → 340 / 620).
  await expect(page.getByText("340 / 620")).toBeVisible();

  // Rakı has a bottle column (1.400 is unique to it) — proving the GLASS+BOTTLE
  // grouping renders. (Label text is "Şişe"; it's only CSS-uppercased.)
  await expect(page.getByRole("heading", { name: "Rakı" })).toBeVisible();
  await expect(page.getByText("1.400", { exact: true })).toBeVisible();
});

test("wines show BOTTLE/GLASS labels, not the old Şişe/Kadeh", async ({
  page,
}) => {
  await page.goto("/terrace/wines");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Wines" }),
  });
  await expect(section.getByText("BOTTLE").first()).toBeVisible();
  await expect(section.getByText("GLASS").first()).toBeVisible();
  await expect(section.getByText("Kadeh")).toHaveCount(0);
});

test("prices render as plain numbers (no ₺ tofu)", async ({ page }) => {
  await page.goto("/terrace/starters");
  await expect(page.getByText("₺")).toHaveCount(0);
});

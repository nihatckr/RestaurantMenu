import { test, expect, type Locator } from "@playwright/test";

// Human-workflow e2e: navigate the public menu the way a guest does and assert
// the layouts/content this session aligned to Figma + the legacy apps. These
// exercise the real rendered pages (not internal functions). The menu renders in
// ONE language at a time; the locale lives in the URL (/[locale]/…).

// y-position of each matched element's box — used to prove "N per row".
async function rowYs(cards: Locator): Promise<number[]> {
  return cards.evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().y)),
  );
}

test("landing lists categories, shows brand mark, and navigates into one", async ({
  page,
}) => {
  await page.goto("/tr/terrace");

  // Brand mark (MO/NO) at the top of the landing (exact — the footer wordmark's
  // alt is "Mono Terrace", which would also substring-match "Mono").
  await expect(page.getByRole("img", { name: "Mono", exact: true })).toBeVisible();

  // Category links are listed in the page language (Turkish by default).
  const desserts = page.getByRole("link", { name: /Tatlılar/ });
  await expect(page.getByRole("link", { name: /Başlangıçlar/ })).toBeVisible();
  await expect(desserts).toBeVisible();

  // Guest taps a category → lands on its page (locale segment preserved).
  await desserts.click();
  await expect(page).toHaveURL(/\/tr\/terrace\/desserts$/);
  await expect(page.getByRole("heading", { name: "Tatlılar" })).toBeVisible();
});

test("language switcher swaps the whole menu to one language", async ({ page }) => {
  await page.goto("/tr/terrace");
  // Turkish by default.
  await expect(page.getByRole("link", { name: /Başlangıçlar/ })).toBeVisible();

  // Guest taps EN → URL switches locale, same venue, and content is now English.
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/terrace$/);
  await expect(page.getByRole("link", { name: /Starters/ })).toBeVisible();
  // Single language: the Turkish name is no longer shown.
  await expect(page.getByRole("link", { name: /Başlangıçlar/ })).toHaveCount(0);
});

test("switching to Russian localizes categories and falls back to Turkish for untranslated items", async ({
  page,
}) => {
  await page.goto("/tr/terrace");
  await page.getByRole("link", { name: "РУ", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/terrace$/);

  // Categories are fully translated → shown in Russian.
  const zakuski = page.getByRole("link", { name: /Закуски/ });
  await expect(zakuski).toBeVisible();
  await zakuski.click();
  await expect(page).toHaveURL(/\/ru\/terrace\/starters$/);
  await expect(page.getByRole("heading", { name: "Закуски" })).toBeVisible();

  // A product with a Russian title renders in Cyrillic (single-scroll page shows
  // every category, so the wraps/burgers item is on the page too).
  await expect(page.getByText("Моно Бургер")).toBeVisible();
  // A product WITHOUT a Russian title falls back to Turkish — never blank.
  await expect(page.getByText("Kalamar", { exact: true })).toBeVisible();
});

test("tapping the brand logo returns to the venue landing", async ({ page }) => {
  await page.goto("/tr/terrace/desserts");
  // The top MO/NO mark links "home" (the venue landing).
  await page.getByRole("link", { name: "Mono", exact: true }).click();
  await expect(page).toHaveURL(/\/tr\/terrace$/);
  await expect(page.getByRole("link", { name: /Başlangıçlar/ })).toBeVisible();
});

test("desserts render two-up (legacy per-category grid)", async ({ page }) => {
  await page.goto("/tr/terrace/desserts");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Tatlılar" }),
  });
  const cards = section.locator("article");
  await expect(cards).toHaveCount(3);

  // First two cards share a row, the third wraps → exactly 2 columns.
  const ys = await rowYs(cards);
  expect(Math.abs(ys[0] - ys[1])).toBeLessThan(5);
  expect(ys[2]).toBeGreaterThan(ys[0] + 20);
});

test("cocktails render five-up tall tiles", async ({ page }) => {
  await page.goto("/en/terrace/cocktails");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Cocktails" }),
  });
  await expect(section.getByText("Aperol Spritz")).toBeVisible();

  // 4 cocktails fit one row in a 5-col grid → all share the same y.
  const ys = await rowYs(section.locator("article"));
  expect(ys.length).toBe(4);
  for (const y of ys) expect(Math.abs(y - ys[0])).toBeLessThan(5);
});

test("hard drinks: localized sub-headers + grouped GLASS/BOTTLE prices", async ({
  page,
}) => {
  await page.goto("/en/terrace/hard-drinks");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Spirits" }),
  });

  // Sub-category header is localized (English tag vocabulary).
  await expect(page.getByRole("heading", { name: "Whisky" })).toBeVisible();

  // Aligned measure columns: a GLASS pour (4 CL) and a BOTTLE size (35 CL) each
  // render as their own header column, proving the grouped layout.
  await expect(section.getByText("4 CL").first()).toBeVisible();
  await expect(section.getByText("35 CL").first()).toBeVisible();
  // A glass price sits under its column (Standart whisky, 4 CL → 340).
  await expect(section.getByText("340", { exact: true }).first()).toBeVisible();

  // Rakı has a bottle column (1400 is unique to it).
  await expect(page.getByRole("heading", { name: "Rakı" })).toBeVisible();
  await expect(page.getByText("1400", { exact: true })).toBeVisible();
});

test("wines show BOTTLE/GLASS labels, not the old Şişe/Kadeh", async ({
  page,
}) => {
  await page.goto("/en/terrace/wines");
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Wines" }),
  });
  await expect(section.getByText("BOTTLE").first()).toBeVisible();
  await expect(section.getByText("GLASS").first()).toBeVisible();
  await expect(section.getByText("Kadeh")).toHaveCount(0);
});

test("prices render as plain numbers (no ₺ tofu)", async ({ page }) => {
  await page.goto("/tr/terrace/starters");
  await expect(page.getByText("₺")).toHaveCount(0);
});

test("admin logs in, gets the header logout, and logs out", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/); // redirected to the menu after login

  // Admin mode + logout live in the page header when logged in.
  await expect(page.getByRole("button", { name: "Çıkış yap" })).toBeVisible();

  // Visiting /login while logged in bounces back to the menu (no getting stuck).
  await page.goto("/tr/login");
  await expect(page).toHaveURL(/\/tr$/);

  // Log out from the header → back to a logged-out login form.
  await page.getByRole("button", { name: "Çıkış yap" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Giriş" })).toBeVisible();
});

test("admin creates and deletes a category inline", async ({ page }) => {
  // Unique name so parallel runs / leftovers never collide.
  const name = `E2E ${Date.now()}`;

  // Log in, then open the venue landing (where the category manager appears).
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/terrace");

  // Add a category via the modal (the add control on the category list).
  await page.getByRole("button", { name: "Kategori ekle" }).click();
  await page.getByLabel("Ad (Türkçe)").fill(name);
  await page.getByRole("button", { name: "Kaydet" }).click();

  // It appears in the public category nav immediately (updateTag read-your-own-writes).
  await expect(page.getByRole("link", { name })).toBeVisible();

  // Delete it → confirm → it's gone from the nav again.
  await page.getByRole("button", { name: `${name} sil` }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByRole("link", { name })).toHaveCount(0);
});

test("admin creates and deletes a product inline on a category page", async ({
  page,
}) => {
  const title = `E2EÜrün ${Date.now()}`; // unique so runs never collide

  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/terrace/starters");

  // "Ürün ekle" lives in each category section — scope to the Başlangıçlar one so
  // the new product lands in that category (the form preselects it).
  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Başlangıçlar" }),
  });
  await section.getByRole("button", { name: "Ürün ekle" }).click();
  await page.getByLabel("Ad (Türkçe)").fill(title);
  await page.getByRole("button", { name: "Kaydet" }).click();

  // It shows up in the section immediately (updateTag read-your-own-writes).
  await expect(page.getByText(title)).toBeVisible();

  // Delete it via the inline card control → confirm → gone.
  await page.getByRole("button", { name: `${title} sil` }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});

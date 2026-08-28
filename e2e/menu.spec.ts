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

  // Hide it → toggle flips to "göster"; show it again (round-trips visibility).
  await page.getByRole("button", { name: `${name} gizle` }).click();
  await expect(page.getByRole("button", { name: `${name} göster` })).toBeVisible();
  await page.getByRole("button", { name: `${name} göster` }).click();
  await expect(page.getByRole("button", { name: `${name} gizle` })).toBeVisible();

  // Delete it → confirm → it's gone from the nav again.
  await page.getByRole("button", { name: `${name} sil` }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByRole("link", { name })).toHaveCount(0);
});

test("admin reorders categories with the up/down arrows", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/terrace");

  const nav = page.getByRole("navigation", { name: "Menu categories" });
  const links = nav.getByRole("link");
  const first = (await links.nth(0).textContent())?.trim() ?? "";
  const second = (await links.nth(1).textContent())?.trim() ?? "";
  expect(first).not.toEqual(second);

  // Move the 2nd category up → it becomes the 1st.
  await page.getByRole("button", { name: `${second} yukarı taşı` }).click();
  await expect(links.nth(0)).toHaveText(second);
  await expect(links.nth(1)).toHaveText(first);

  // Move it back down → original order restored (leaves data as it was).
  await page.getByRole("button", { name: `${second} aşağı taşı` }).click();
  await expect(links.nth(0)).toHaveText(first);
  await expect(links.nth(1)).toHaveText(second);
});

test("admin adds a product with labelled measure prices", async ({ page }) => {
  const title = `E2EÖlçü ${Date.now()}`;
  const measure = `Ölçü${Date.now()}`; // unique label so it never collides

  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/terrace/starters");

  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Başlangıçlar" }),
  });
  await section.getByRole("button", { name: "Ürün ekle" }).first().click();
  await page.getByLabel("Ad (Türkçe)").fill(title);
  // Imageless DRINK renders the compact card that shows measure columns.
  await page.locator('select[name="kind"]').selectOption("DRINK");
  await page.getByRole("button", { name: "Ölçü ekle" }).click();
  await page.getByPlaceholder("Ölçü (ör. Kadeh)").fill(measure);
  await page.getByPlaceholder("Fiyat").fill("340");
  await page.getByRole("button", { name: "Kaydet" }).click();

  // The card shows the measure label (and its price) — proof prices persisted.
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(measure)).toBeVisible();

  // Clean up.
  await page.getByRole("button", { name: `${title} sil` }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});

test("guests are redirected away from the settings page", async ({ page }) => {
  await page.goto("/tr/settings");
  await expect(page).toHaveURL(/\/login$/);
});

test("admin opens settings from the header and uploads a brand logo", async ({
  page,
}) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWM4EaCBFTEMLQkAaplQAdEjY8UAAAAASUVORK5CYII=",
    "base64",
  );

  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);

  // Settings is reachable from the admin header chip.
  await page.getByRole("link", { name: "Ayarlar" }).click();
  await expect(page).toHaveURL(/\/tr\/settings$/);
  await expect(page.getByRole("heading", { name: "Ayarlar" })).toBeVisible();

  // Upload a brand logo via the first (brand) image form.
  await page
    .locator('input[type="file"][name="image"]')
    .first()
    .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("button", { name: "Kaydet" }).first()).toBeEnabled();
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  // Preview persists after the save round-trip (state.ok → refresh).
  await expect(page.locator('img[alt=""]').first()).toBeVisible();

  // Clean up: remove the logo again so the default mark is restored.
  await page.getByRole("button", { name: "Marka logosu kaldır" }).click();
  await page.getByRole("button", { name: "Kaydet" }).first().click();
});

test("admin downloads the Excel backup from settings", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "Yedek" }).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Yedek indir (Excel)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^menu-yedek-.*\.xlsx$/);
});

test("admin routes reject unauthenticated requests (401)", async ({ page }) => {
  // No login — the request carries no admin session cookie.
  expect((await page.request.get("/admin/export")).status()).toBe(401);
  expect((await page.request.get("/admin/qr/terrace")).status()).toBe(401);
});

test("product image upload rejects a non-image file", async ({ page }) => {
  const title = `E2ERed ${Date.now()}`;
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/terrace/starters");

  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Başlangıçlar" }),
  });
  await section.getByRole("button", { name: "Ürün ekle" }).first().click();
  await page.getByLabel("Ad (Türkçe)").fill(title);
  // A text file (accept="image/*" is bypassed by setInputFiles) → server rejects.
  await page.locator('input[type="file"][name="image"]').setInputFiles({
    name: "notimage.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("definitely not an image"),
  });
  await page.getByRole("button", { name: "Kaydet" }).click();

  await expect(page.getByText(/Görsel dosyası seçin/)).toBeVisible();
  // The product was NOT created (rejected before the write).
  await page.getByRole("button", { name: "İptal" }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});

test("the login page is marked noindex", async ({ page }) => {
  await page.goto("/tr/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("admin actions show up in the settings activity log", async ({ page }) => {
  const name = `E2ELog ${Date.now()}`;

  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/terrace");

  await page.getByRole("button", { name: "Kategori ekle" }).click();
  await page.getByLabel("Ad (Türkçe)").fill(name);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();

  // The create is recorded in the audit trail on Settings.
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "Son işlemler" }).click();
  await expect(page.getByRole("heading", { name: "Son işlemler" })).toBeVisible();
  await expect(page.getByText(name)).toBeVisible();

  // Clean up.
  await page.goto("/tr/terrace");
  await page.getByRole("button", { name: `${name} sil` }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
});

// Serial: the "empty trash" test purges the whole (business-wide) trash, so it
// must not race the restore test which relies on its trashed item persisting.
test.describe.serial("trash bin", () => {
  test("admin restores a trashed category from settings", async ({ page }) => {
    const name = `E2EÇöp ${Date.now()}`;

    await page.goto("/tr/login");
    await page.getByLabel("Şifre").fill("1234");
    await page.getByRole("button", { name: "Giriş" }).click();
    await expect(page).toHaveURL(/\/tr$/);
    await page.goto("/tr/terrace");

    // Create then trash a category.
    await page.getByRole("button", { name: "Kategori ekle" }).click();
    await page.getByLabel("Ad (Türkçe)").fill(name);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByRole("link", { name })).toBeVisible();
    await page.getByRole("button", { name: `${name} sil` }).click();
    await page.getByRole("button", { name: "Sil", exact: true }).click();
    await expect(page.getByRole("link", { name })).toHaveCount(0);

    // Restore it from the settings trash tab…
    await page.goto("/tr/settings");
    await page.getByRole("tab", { name: "Çöp kutusu" }).click();
    const trashRow = page
      .locator("li")
      .filter({ hasText: name })
      .filter({ has: page.getByRole("button", { name: "Geri al" }) });
    await trashRow.getByRole("button", { name: "Geri al" }).click();
    // Wait for the restore to land (the row leaves the trash) before navigating.
    await expect(trashRow).toHaveCount(0);

    // …and it's back in the public category nav.
    await page.goto("/tr/terrace");
    await expect(page.getByRole("link", { name })).toBeVisible();

    // Clean up: trash it again so it leaves the live menu.
    await page.getByRole("button", { name: `${name} sil` }).click();
    await page.getByRole("button", { name: "Sil", exact: true }).click();
  });

  test("admin permanently empties the trash", async ({ page }) => {
    const name = `E2EBoşalt ${Date.now()}`;

    await page.goto("/tr/login");
    await page.getByLabel("Şifre").fill("1234");
    await page.getByRole("button", { name: "Giriş" }).click();
    await expect(page).toHaveURL(/\/tr$/);
    await page.goto("/tr/terrace");

    // Create then trash a category so there's something to purge.
    await page.getByRole("button", { name: "Kategori ekle" }).click();
    await page.getByLabel("Ad (Türkçe)").fill(name);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await page.getByRole("button", { name: `${name} sil` }).click();
    await page.getByRole("button", { name: "Sil", exact: true }).click();

    await page.goto("/tr/settings");
    await page.getByRole("tab", { name: "Çöp kutusu" }).click();

    // Our trashed row (name + a "Geri al" button) is present, then gone after empty.
    const row = page
      .locator("li")
      .filter({ hasText: name })
      .filter({ has: page.getByRole("button", { name: "Geri al" }) });
    await expect(row).toHaveCount(1);

    await page.getByRole("button", { name: "Çöp kutusunu boşalt" }).click();
    await page.getByRole("button", { name: "Kalıcı olarak sil" }).click();

    await expect(row).toHaveCount(0);
  });
});

test("admin exports then re-imports the backup (round-trip)", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "Yedek" }).click();

  // Download the current backup…
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Yedek indir (Excel)" }).click(),
  ]);
  const file = await download.path();

  // …then feed the exact same file back into the importer (upsert = idempotent).
  await page.locator('input[type="file"][name="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "Yedeği içe aktar" }).click();
  await expect(page.getByText(/İçe aktarıldı:/)).toBeVisible();
});

test("import rejects a file that isn't a valid workbook", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "Yedek" }).click();

  await page.locator('input[type="file"][name="file"]').setInputFiles({
    name: "notreal.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("this is not a spreadsheet"),
  });
  await page.getByRole("button", { name: "Yedeği içe aktar" }).click();
  await expect(page.getByText(/Dosya okunamadı/)).toBeVisible();
});

test("admin adds a venue (appears in the chooser) and deletes it", async ({
  page,
}) => {
  const name = `E2EMekan ${Date.now()}`;

  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);

  // Add a venue via the Mekanlar tab.
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "Mekanlar" }).click();
  await page.getByRole("button", { name: "Mekan ekle" }).click();
  await page.getByLabel("Mekan adı").fill(name);
  await page.getByRole("button", { name: "Ekle", exact: true }).click();

  // Its row (with a delete control) shows in the manager.
  await expect(page.getByRole("button", { name: `${name} sil` })).toBeVisible();

  // …and it's live in the public venue chooser.
  await page.goto("/tr");
  await expect(page.getByRole("link", { name })).toBeVisible();

  // Delete it → confirm → gone from the manager and the chooser.
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "Mekanlar" }).click();
  await page.getByRole("button", { name: `${name} sil` }).click();
  await page.getByRole("button", { name: "Kalıcı olarak sil" }).click();
  await expect(page.getByRole("button", { name: `${name} sil` })).toHaveCount(0);

  await page.goto("/tr");
  await expect(page.getByRole("link", { name })).toHaveCount(0);
});

test("admin sets and clears the business footer note", async ({ page }) => {
  const note = `E2ENot ${Date.now()}`;

  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);

  // Set the extra footer line, then confirm it PERSISTS (the form re-reads it
  // fresh on reload — deterministic, unlike the cached public footer).
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "İşletme" }).click();
  await page.locator('input[name="footerExtra"]').fill(note);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "İşletme" }).click();
  await expect(page.locator('input[name="footerExtra"]')).toHaveValue(note);

  // Clear it again (leaves the DB clean for the public footer).
  await page.locator('input[name="footerExtra"]').fill("");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "İşletme" }).click();
  await expect(page.locator('input[name="footerExtra"]')).toHaveValue("");
});

test("admin sees and downloads a venue QR code", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "QR kodları" }).click();

  await expect(page.getByRole("img", { name: "Mono Terrace QR kodu" })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /İndir/ }).first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^qr-.*\.png$/);
});

test("settings warns while the default password is active", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/settings");
  await expect(page.getByText(/Varsayılan şifre/)).toBeVisible();
});

test("admin changes the password (current verified)", async ({ page }) => {
  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/settings");
  await page.getByRole("tab", { name: "Güvenlik" }).click();

  // Wrong current password → rejected.
  await page.locator('input[name="current"]').fill("yanlis");
  await page.locator('input[name="next"]').fill("1234");
  await page.locator('input[name="confirm"]').fill("1234");
  await page.getByRole("button", { name: "Şifreyi değiştir" }).click();
  await expect(page.getByText("Mevcut şifre hatalı.")).toBeVisible();

  // Correct current → saved. Keep the value "1234" so parallel logins still work.
  await page.locator('input[name="current"]').fill("1234");
  await page.locator('input[name="next"]').fill("1234");
  await page.locator('input[name="confirm"]').fill("1234");
  await page.getByRole("button", { name: "Şifreyi değiştir" }).click();
  // exact: the audit log ("— şifre değiştirildi") would substring-match otherwise.
  await expect(page.getByText("Şifre değiştirildi", { exact: true })).toBeVisible();
});

test("admin uploads a product photo", async ({ page }) => {
  const title = `E2EFoto ${Date.now()}`;
  // A tiny valid 8×8 PNG so sharp can decode + re-encode it.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWM4EaCBFTEMLQkAaplQAdEjY8UAAAAASUVORK5CYII=",
    "base64",
  );

  await page.goto("/tr/login");
  await page.getByLabel("Şifre").fill("1234");
  await page.getByRole("button", { name: "Giriş" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto("/tr/terrace/starters");

  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Başlangıçlar" }),
  });
  await section.getByRole("button", { name: "Ürün ekle" }).first().click();
  await page.getByLabel("Ad (Türkçe)").fill(title);
  await page
    .locator('input[type="file"][name="image"]')
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png });

  // The picker shows a live preview inside the modal before saving.
  await expect(page.getByRole("dialog").locator("img")).toBeVisible();
  await page.getByRole("button", { name: "Kaydet" }).click();

  // The saved product renders as an image card (photo persisted + served).
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.locator("article", { hasText: title }).locator("img")).toBeVisible();

  // Clean up.
  await page.getByRole("button", { name: `${title} sil` }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByText(title)).toHaveCount(0);
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
  // Two "add product" controls per section (icon in the heading + full button
  // below); the first is the heading-row icon.
  await section.getByRole("button", { name: "Ürün ekle" }).first().click();
  await page.getByLabel("Ad (Türkçe)").fill(title);
  await page.getByRole("button", { name: "Kaydet" }).click();

  // It shows up in the section immediately (updateTag read-your-own-writes).
  await expect(page.getByText(title)).toBeVisible();

  // Hide it from the public menu → the toggle flips to "göster"; show it again.
  await page.getByRole("button", { name: `${title} gizle` }).click();
  await expect(page.getByRole("button", { name: `${title} göster` })).toBeVisible();
  await page.getByRole("button", { name: `${title} göster` }).click();
  await expect(page.getByRole("button", { name: `${title} gizle` })).toBeVisible();

  // Delete it via the inline card control → confirm → gone.
  await page.getByRole("button", { name: `${title} sil` }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});

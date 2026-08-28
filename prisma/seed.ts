import { PrismaClient, ProductKind } from "@prisma/client";
import { PRICES } from "./data/prices";
import { TRANSLATIONS, type LocalizedText } from "./data/translations";

const prisma = new PrismaClient();

// DEMO bootstrap seed — populates an EMPTY database only (Path B, ADMIN_PLAN.md §1).
// Since the admin makes the DB the source of truth, this seed is a dev/demo importer,
// NOT authoritative: it **bails out if the DB already has content** (never overwrites
// or deletes admin-edited rows) and is NOT run on deploy (vercel-build is migrate-
// only). Run it on a fresh DB with `npm run seed:demo` (or `db:seed`); to re-apply
// changed demo data, reset first (`npm run db:reset`).
//
// Two venues sharing one catalog (U11). Content is grounded in legacy evidence.
// PRICES/TRANSLATIONS live in ./data/*.ts and are DEMO values pending real data (U5).

const BUSINESS_ID = "mono";

// `columns` overrides the photo-grid column count (legacy per-category layout:
// desserts/breakfast rendered 2-up; other food 3-up). Omit = kind default.
const CATEGORIES: { slug: string; name: LocalizedText; columns?: number }[] = [
  { slug: "starters", name: { tr: "Başlangıçlar", en: "Starters", ru: "Закуски" } },
  { slug: "salads", name: { tr: "Salatalar", en: "Salads", ru: "Салаты" } },
  { slug: "pastas", name: { tr: "Makarnalar", en: "Pastas", ru: "Паста" } },
  { slug: "wraps-burgers", name: { tr: "Sandviç & Burger", en: "Wraps & Burgers", ru: "Сэндвичи и бургеры" } },
  { slug: "main-courses", name: { tr: "Ana Yemekler", en: "Main Courses", ru: "Основные блюда" } },
  { slug: "desserts", name: { tr: "Tatlılar", en: "Desserts", ru: "Десерты" }, columns: 2 },
  { slug: "cocktails", name: { tr: "Kokteyller", en: "Cocktails", ru: "Коктейли" } },
  { slug: "beers", name: { tr: "Biralar", en: "Beers", ru: "Пиво" } },
  { slug: "wines", name: { tr: "Şaraplar", en: "Wines", ru: "Вина" } },
  { slug: "hard-drinks", name: { tr: "Alkollü İçecekler", en: "Spirits", ru: "Крепкие напитки" } },
  { slug: "soft-drinks", name: { tr: "Soft İçecekler", en: "Soft Drinks", ru: "Безалкогольные" } },
  { slug: "breakfast", name: { tr: "Kahvaltı", en: "Breakfast", ru: "Завтрак" }, columns: 2 },
];

// Products carry identity only (kind, category, tag). Prices come from PRICES
// (./data/prices.ts) and all localized text from TRANSLATIONS
// (./data/translations.ts) — one source of truth each, easy to update.
type ProductSeed = {
  slug: string;
  kind: ProductKind;
  category: string;
  tag?: string;
};

const PRODUCTS: ProductSeed[] = [
  { slug: "kalamar", kind: "FOOD", category: "starters" },
  { slug: "falafel", kind: "FOOD", category: "starters" },
  { slug: "karisik-kizartma", kind: "FOOD", category: "starters" },
  { slug: "spring-rolls", kind: "FOOD", category: "starters" },

  { slug: "roka-salatasi", kind: "FOOD", category: "salads" },
  { slug: "mono-fit", kind: "FOOD", category: "salads" },
  { slug: "tavuklu-sezar", kind: "FOOD", category: "salads" },

  { slug: "spagetti-bolognese", kind: "FOOD", category: "pastas" },
  { slug: "fettucini-alfredo", kind: "FOOD", category: "pastas" },
  { slug: "penne-arabiata", kind: "FOOD", category: "pastas" },
  { slug: "manti", kind: "FOOD", category: "pastas" },

  { slug: "mono-burger", kind: "FOOD", category: "wraps-burgers" },
  { slug: "cheeseburger", kind: "FOOD", category: "wraps-burgers" },
  { slug: "vegan-wrap", kind: "FOOD", category: "wraps-burgers" },
  { slug: "tavuklu-quesedilla", kind: "FOOD", category: "wraps-burgers" },

  { slug: "dana-antrikot", kind: "FOOD", category: "main-courses" },
  { slug: "somon-izgara", kind: "FOOD", category: "main-courses" },
  { slug: "kuzu-incik", kind: "FOOD", category: "main-courses" },
  { slug: "cokertme-kebabi", kind: "FOOD", category: "main-courses" },

  { slug: "san-sebastian", kind: "FOOD", category: "desserts" },
  { slug: "baileys-tiramisu", kind: "FOOD", category: "desserts" },
  { slug: "meyve-tabagi", kind: "FOOD", category: "desserts" },

  { slug: "aperol-spritz", kind: "DRINK", category: "cocktails", tag: "Cocktail" },
  { slug: "mojito", kind: "DRINK", category: "cocktails", tag: "Cocktail" },
  { slug: "negroni", kind: "DRINK", category: "cocktails", tag: "Cocktail" },
  { slug: "margarita", kind: "DRINK", category: "cocktails", tag: "Cocktail" },

  // ── DEMO drinks (placeholder, NOT evidenced) ──────────────────────────────
  // Structurally faithful to the legacy drink displays so the UI works: beers
  // show a serving cl; wines show bottle/glass + a DLC (label) badge; spirits are
  // grouped by `tag` sub-category (Viski/Rakı/…) with multi-cl pricing; soft
  // drinks use colour chips. Replace names/prices with the real list (U5).
  { slug: "fici-bira", kind: "DRINK", category: "beers", tag: "Beer" },
  { slug: "sise-bira", kind: "DRINK", category: "beers", tag: "Beer" },

  { slug: "kirmizi-sarap-ev", kind: "DRINK", category: "wines" },
  { slug: "beyaz-sarap-ev", kind: "DRINK", category: "wines" },
  { slug: "kirmizi-sarap-sise", kind: "DRINK", category: "wines" },

  { slug: "viski-standart", kind: "DRINK", category: "hard-drinks", tag: "Viski" },
  { slug: "viski-premium", kind: "DRINK", category: "hard-drinks", tag: "Viski" },
  { slug: "raki", kind: "DRINK", category: "hard-drinks", tag: "Rakı" },
  { slug: "raki-ozel", kind: "DRINK", category: "hard-drinks", tag: "Rakı" },
  { slug: "votka", kind: "DRINK", category: "hard-drinks", tag: "Votka" },
  { slug: "votka-premium", kind: "DRINK", category: "hard-drinks", tag: "Votka" },
  { slug: "cin", kind: "DRINK", category: "hard-drinks", tag: "Cin" },
  { slug: "cin-premium", kind: "DRINK", category: "hard-drinks", tag: "Cin" },
  { slug: "viski-single-malt", kind: "DRINK", category: "hard-drinks", tag: "Viski" },
  { slug: "tekila", kind: "DRINK", category: "hard-drinks", tag: "Tekila" },
  { slug: "tekila-anejo", kind: "DRINK", category: "hard-drinks", tag: "Tekila" },
  { slug: "rom-beyaz", kind: "DRINK", category: "hard-drinks", tag: "Rom" },
  { slug: "rom-esmer", kind: "DRINK", category: "hard-drinks", tag: "Rom" },
  { slug: "konyak", kind: "DRINK", category: "hard-drinks", tag: "Konyak" },
  { slug: "likor", kind: "DRINK", category: "hard-drinks", tag: "Likör" },

  { slug: "kola", kind: "DRINK", category: "soft-drinks" },
  { slug: "soda", kind: "DRINK", category: "soft-drinks" },
  { slug: "ayran", kind: "DRINK", category: "soft-drinks" },
  { slug: "su", kind: "DRINK", category: "soft-drinks" },

  { slug: "serpme-kahvalti", kind: "FOOD", category: "breakfast" },
  { slug: "mono-kahvalti", kind: "FOOD", category: "breakfast" },
  { slug: "pankek", kind: "FOOD", category: "breakfast" },
];

// Real product photos ported from the legacy assets (public/products/<slug>).
// Food items only — drink cards render compact rows without an image. Missing
// entries fall back to the placeholder box (PR11).
const IMAGE_BY_SLUG: Record<string, string> = {
  kalamar: "/products/kalamar.png",
  falafel: "/products/falafel.png",
  "karisik-kizartma": "/products/karisik-kizartma.png",
  "spring-rolls": "/products/spring-rolls.png",
  "roka-salatasi": "/products/roka-salatasi.png",
  "mono-fit": "/products/mono-fit.png",
  "tavuklu-sezar": "/products/tavuklu-sezar.png",
  "spagetti-bolognese": "/products/spagetti-bolognese.jpg",
  "fettucini-alfredo": "/products/fettucini-alfredo.jpg",
  "penne-arabiata": "/products/penne-arabiata.jpg",
  manti: "/products/manti.jpg",
  "mono-burger": "/products/mono-burger.jpg",
  cheeseburger: "/products/cheeseburger.jpg",
  "vegan-wrap": "/products/vegan-wrap.jpg",
  "tavuklu-quesedilla": "/products/tavuklu-quesedilla.jpg",
  "dana-antrikot": "/products/dana-antrikot.jpg",
  "somon-izgara": "/products/somon-izgara.jpg",
  "kuzu-incik": "/products/kuzu-incik.jpg",
  "cokertme-kebabi": "/products/cokertme-kebabi.jpg",
  "san-sebastian": "/products/san-sebastian.jpg",
  "baileys-tiramisu": "/products/baileys-tiramisu.jpg",
  "meyve-tabagi": "/products/meyve-tabagi.jpg",
  // Cocktails had their own photos in the legacy menu — keep that.
  "aperol-spritz": "/products/aperol-spritz.jpg",
  mojito: "/products/mojito.jpg",
  negroni: "/products/negroni.jpg",
  margarita: "/products/margarita.jpg",
  "serpme-kahvalti": "/products/serpme-kahvalti.png",
  "mono-kahvalti": "/products/mono-kahvalti.png",
  pankek: "/products/pankek.png",
};

// Drink colour chips (legacy MenuCardSoft/Wines used the product `color` field as
// a translucent background). Imageless drink rows only. DEMO colours.
const COLOR_BY_SLUG: Record<string, string> = {
  "fici-bira": "#e0a83e",
  "sise-bira": "#c88a2e",
  "kirmizi-sarap-ev": "#7b1e2b",
  "beyaz-sarap-ev": "#e6dfa8",
  "kirmizi-sarap-sise": "#5b1620",
  "viski-standart": "#b5651d",
  "viski-premium": "#8a4a13",
  raki: "#dfe6ec",
  "raki-ozel": "#cfd8e0",
  votka: "#eef2f4",
  cin: "#dfeae0",
  kola: "#3b2417",
  soda: "#cfe8f3",
  ayran: "#f2f2f2",
  su: "#cfe8f3",
};

// Wines with a valid label carry the legacy "DLC" badge; house wines don't.
const DLC = new Set(["kirmizi-sarap-sise"]);

// Per-item, per-venue availability (legacy mn_show_content / mngarden_show_content):
// a shared product can be hidden in one venue's menu. Slugs listed are HIDDEN in
// that venue.
// Per-item, per-venue hiding (legacy mn_show_content / mngarden_show_content).
// Mechanism kept, but no items are hidden — the real per-venue product list is
// unknown (dead backend), and the shared catalog shows in full in both venues.
const HIDDEN_BY_VENUE: Record<string, string[]> = {};

// Featured items span the full category width (legacy featured the first two
// breakfast spreads). Data-driven — no category name is hard-coded.
const FEATURED = new Set(["serpme-kahvalti", "mono-kahvalti"]);

type VenueSeed = {
  slug: string;
  name: string;
  wordmark: string;
  sortOrder: number;
  order: { category: string; sortOrder: number; visible?: boolean }[];
};

const FOOD_ORDER = [
  "starters",
  "salads",
  "pastas",
  "wraps-burgers",
  "main-courses",
  "desserts",
];

const VENUES: VenueSeed[] = [
  {
    slug: "terrace",
    name: "Mono Terrace",
    wordmark: "/brand/mono-terrace.svg",
    sortOrder: 1,
    order: [
      ...FOOD_ORDER.map((category, i) => ({ category, sortOrder: i + 1 })),
      { category: "cocktails", sortOrder: 7 },
      { category: "beers", sortOrder: 8 },
      { category: "wines", sortOrder: 9 },
      { category: "hard-drinks", sortOrder: 10 },
      { category: "soft-drinks", sortOrder: 11 },
      // Legacy Terrace Navigation filters breakfast out (id dGVybToy) → hidden here.
      { category: "breakfast", sortOrder: 12, visible: false },
    ],
  },
  {
    slug: "garden",
    name: "Mono Garden",
    wordmark: "/brand/mono.svg",
    sortOrder: 2,
    order: [
      ...FOOD_ORDER.map((category, i) => ({ category, sortOrder: i + 1 })),
      { category: "cocktails", sortOrder: 7 },
      { category: "wines", sortOrder: 8 },
      { category: "soft-drinks", sortOrder: 9 },
      { category: "beers", sortOrder: 10 },
      { category: "hard-drinks", sortOrder: 11 },
      { category: "breakfast", sortOrder: 12, visible: true }, // Garden shows breakfast (legacy)
    ],
  },
];

// Fail loudly on content drift BEFORE writing anything: the seed is the single
// source of content, so a missing translation, orphan key or unknown category is a
// data bug, not something to seed silently. Cheap insurance for the fill-in files.
function assertContentIntegrity() {
  const slugs = new Set(PRODUCTS.map((p) => p.slug));
  const catSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const problems: string[] = [];

  for (const p of PRODUCTS) {
    if (!catSlugs.has(p.category))
      problems.push(`product "${p.slug}" → unknown category "${p.category}"`);
    const t = TRANSLATIONS[p.slug];
    if (!t) problems.push(`TRANSLATIONS missing entry for product "${p.slug}"`);
    else if (!t.title.tr?.trim())
      problems.push(`TRANSLATIONS["${p.slug}"].title.tr is empty (tr is required)`);
  }
  for (const key of Object.keys(TRANSLATIONS))
    if (!slugs.has(key)) problems.push(`TRANSLATIONS has orphan key "${key}" (no such product)`);
  for (const key of Object.keys(PRICES))
    if (!slugs.has(key)) problems.push(`PRICES has orphan key "${key}" (no such product)`);

  if (problems.length)
    throw new Error(`Seed content integrity check failed:\n - ${problems.join("\n - ")}`);
}

// Every locale used in TRANSLATIONS must be one the business supports, else it
// would be silently ignored (the product loop iterates business.locales).
function assertLocalesSupported(supported: string[]) {
  const ok = new Set(supported);
  const used = new Set<string>();
  for (const t of Object.values(TRANSLATIONS))
    for (const field of [t.title, t.subtitle, t.description])
      if (field) for (const l of Object.keys(field)) used.add(l);
  const stray = [...used].filter((l) => !ok.has(l));
  if (stray.length)
    throw new Error(
      `TRANSLATIONS use locale(s) [${stray.join(", ")}] not in business.locales [${supported.join(", ")}]`,
    );
}

async function main() {
  assertContentIntegrity();

  const business = await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: {},
    create: { id: BUSINESS_ID, name: "Mono" },
  });
  assertLocalesSupported(business.locales);

  // Bootstrap-only: if the DB already holds content, the admin (or a prior seed) owns
  // it — never touch it. Only an empty DB gets the demo data.
  const existingContent =
    (await prisma.venue.count()) + (await prisma.product.count());
  if (existingContent > 0) {
    console.log(
      "Seed skipped — DB already has content (DB/admin is the source of truth).",
    );
    return;
  }

  const categoryIdBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { businessId_slug: { businessId: business.id, slug: c.slug } },
      update: { columns: c.columns ?? null },
      create: { businessId: business.id, slug: c.slug, columns: c.columns ?? null },
    });
    categoryIdBySlug.set(c.slug, cat.id);
    for (const [locale, name] of Object.entries(c.name)) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: cat.id, locale } },
        update: { name },
        create: { categoryId: cat.id, locale, name },
      });
    }
  }

  const productIdBySlug = new Map<string, string>();
  for (const p of PRODUCTS) {
    const image = IMAGE_BY_SLUG[p.slug] ?? null;
    const color = COLOR_BY_SLUG[p.slug] ?? null;
    const dlc = DLC.has(p.slug);
    const prod = await prisma.product.upsert({
      where: { businessId_slug: { businessId: business.id, slug: p.slug } },
      update: { kind: p.kind, tag: p.tag ?? null, image, color, dlc },
      create: { businessId: business.id, slug: p.slug, kind: p.kind, tag: p.tag ?? null, image, color, dlc },
    });
    productIdBySlug.set(p.slug, prod.id);
    const text = TRANSLATIONS[p.slug];
    if (!text) throw new Error(`Missing TRANSLATIONS entry for product "${p.slug}"`);
    // Data-driven: iterate the business's supported locales (schema default
    // ["tr","en","ru"]) — no hard-coded language list. A filled title creates the
    // row; a blank ("") locale is skipped (app falls back to the default language).
    const pick = (field?: LocalizedText, locale?: string) =>
      field && locale ? field[locale as keyof LocalizedText]?.trim() : undefined;
    for (const locale of business.locales) {
      const title = pick(text.title, locale);
      if (!title) continue; // blank → no row; app falls back to the default language

      const subtitle = pick(text.subtitle, locale) || null;
      const description = pick(text.description, locale) || null;
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: prod.id, locale } },
        update: { title, subtitle, description },
        create: { productId: prod.id, locale, title, subtitle, description },
      });
    }
  }

  for (const v of VENUES) {
    const venue = await prisma.venue.upsert({
      where: { slug: v.slug },
      update: { name: v.name, wordmark: v.wordmark, sortOrder: v.sortOrder, businessId: business.id },
      create: { slug: v.slug, name: v.name, wordmark: v.wordmark, sortOrder: v.sortOrder, businessId: business.id },
    });
    const hidden = new Set(HIDDEN_BY_VENUE[v.slug] ?? []);
    const menu = await prisma.menu.upsert({
      where: { venueId: venue.id },
      update: {},
      create: { venueId: venue.id },
    });

    for (const mc of v.order) {
      const categoryId = categoryIdBySlug.get(mc.category)!;
      await prisma.menuCategory.upsert({
        where: { menuId_categoryId: { menuId: menu.id, categoryId } },
        update: { sortOrder: mc.sortOrder, visible: mc.visible ?? true },
        create: { menuId: menu.id, categoryId, sortOrder: mc.sortOrder, visible: mc.visible ?? true },
      });
    }

    const orderByCategory = new Map<string, number>();
    for (const p of PRODUCTS) {
      const productId = productIdBySlug.get(p.slug)!;
      const categoryId = categoryIdBySlug.get(p.category)!;
      const order = orderByCategory.get(p.category) ?? 0;
      orderByCategory.set(p.category, order + 1);

      // Price from the single PRICES map: array = labelled measures, number =
      // single price (multi-measure items leave MenuItem.price null).
      const pv = PRICES[p.slug];
      const options = Array.isArray(pv) ? pv : undefined;
      const price = Array.isArray(pv) ? null : (pv ?? null);
      const available = !hidden.has(p.slug); // per-item, per-venue visibility
      const featured = FEATURED.has(p.slug);

      const menuItem = await prisma.menuItem.upsert({
        where: { menuId_productId: { menuId: menu.id, productId } },
        update: { categoryId, price, available, featured, sortOrder: order },
        create: { menuId: menu.id, productId, categoryId, price, available, featured, sortOrder: order },
      });
      if (options) {
        for (let i = 0; i < options.length; i++) {
          const o = options[i];
          await prisma.menuItemPrice.upsert({
            where: { menuItemId_label: { menuItemId: menuItem.id, label: o.label } },
            update: { amount: o.amount, sortOrder: i },
            create: { menuItemId: menuItem.id, label: o.label, amount: o.amount, sortOrder: i },
          });
        }
      }
    }
  }

  const [venues, cats, prods, items] = await Promise.all([
    prisma.venue.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.menuItem.count(),
  ]);
  console.log(`Seed OK — venues:${venues} categories:${cats} products:${prods} menuItems:${items}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

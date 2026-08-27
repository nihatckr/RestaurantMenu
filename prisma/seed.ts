import { PrismaClient, ProductKind } from "@prisma/client";
import { PRICES } from "./data/prices";

const prisma = new PrismaClient();

// Idempotent seed (re-runnable). Two venues sharing one catalog (U11 = two
// venues). Content is grounded in legacy evidence: product names come from the
// legacy asset folders (real menu items) and the category set mirrors the legacy
// structure. Per-venue differences (Terrace hides Breakfast; drink ordering;
// per-item visibility) are DATA, never code (AGENTS.md 10).
//
// PRICES live in ./data/prices.ts (single place to edit) and are DEMO values
// pending a real source (DATA_SOURCING.md / U5). No admin UI (T11 = seed-data).

const BUSINESS_ID = "mono";

type Tr = { tr: string; en?: string; ru?: string };

// `columns` overrides the photo-grid column count (legacy per-category layout:
// desserts/breakfast rendered 2-up; other food 3-up). Omit = kind default.
const CATEGORIES: { slug: string; name: Tr; columns?: number }[] = [
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
  { slug: "snacks", name: { tr: "Çerezler", en: "Snacks", ru: "Закуски к напиткам" } },
  { slug: "hookah", name: { tr: "Nargile", en: "Hookah", ru: "Кальян" } },
  { slug: "breakfast", name: { tr: "Kahvaltı", en: "Breakfast", ru: "Завтрак" }, columns: 2 },
];

// Products carry identity only (name, kind, category, tag). Prices come from
// PRICES (./data/prices.ts) — one source of truth, easy to update.
type ProductSeed = {
  slug: string;
  kind: ProductKind;
  category: string;
  tag?: string;
  title: Tr;
};

const PRODUCTS: ProductSeed[] = [
  { slug: "kalamar", kind: "FOOD", category: "starters", title: { tr: "Kalamar", en: "Calamari" } },
  { slug: "falafel", kind: "FOOD", category: "starters", title: { tr: "Falafel", en: "Falafel" } },
  { slug: "karisik-kizartma", kind: "FOOD", category: "starters", title: { tr: "Karışık Kızartma", en: "Mixed Fries" } },
  { slug: "spring-rolls", kind: "FOOD", category: "starters", title: { tr: "Spring Rolls", en: "Spring Rolls" } },

  { slug: "roka-salatasi", kind: "FOOD", category: "salads", title: { tr: "Roka Salatası", en: "Arugula Salad", ru: "Салат из рукколы" } },
  { slug: "mono-fit", kind: "FOOD", category: "salads", title: { tr: "Mono Fit", en: "Mono Fit Salad" } },
  { slug: "tavuklu-sezar", kind: "FOOD", category: "salads", title: { tr: "Tavuklu Sezar Salata", en: "Chicken Caesar Salad" } },

  { slug: "spagetti-bolognese", kind: "FOOD", category: "pastas", title: { tr: "Spagetti Bolognese", en: "Spaghetti Bolognese" } },
  { slug: "fettucini-alfredo", kind: "FOOD", category: "pastas", title: { tr: "Fettucini Alfredo", en: "Fettuccine Alfredo" } },
  { slug: "penne-arabiata", kind: "FOOD", category: "pastas", title: { tr: "Penne Arabiata", en: "Penne Arrabbiata" } },
  { slug: "manti", kind: "FOOD", category: "pastas", title: { tr: "Mantı", en: "Turkish Mantı" } },

  { slug: "mono-burger", kind: "FOOD", category: "wraps-burgers", title: { tr: "Mono Burger", en: "Mono Burger", ru: "Моно Бургер" } },
  { slug: "cheeseburger", kind: "FOOD", category: "wraps-burgers", title: { tr: "Cheeseburger", en: "Cheeseburger" } },
  { slug: "vegan-wrap", kind: "FOOD", category: "wraps-burgers", title: { tr: "Vegan Wrap", en: "Vegan Wrap" } },
  { slug: "tavuklu-quesedilla", kind: "FOOD", category: "wraps-burgers", title: { tr: "Tavuklu Quesadilla", en: "Chicken Quesadilla" } },

  { slug: "dana-antrikot", kind: "FOOD", category: "main-courses", title: { tr: "Dana Antrikot", en: "Beef Entrecôte" } },
  { slug: "somon-izgara", kind: "FOOD", category: "main-courses", title: { tr: "Somon Izgara", en: "Grilled Salmon" } },
  { slug: "kuzu-incik", kind: "FOOD", category: "main-courses", title: { tr: "Kuzu İncik", en: "Lamb Shank" } },
  { slug: "cokertme-kebabi", kind: "FOOD", category: "main-courses", title: { tr: "Çökertme Kebabı", en: "Çökertme Kebab" } },

  { slug: "san-sebastian", kind: "FOOD", category: "desserts", title: { tr: "San Sebastian Cheesecake", en: "San Sebastian Cheesecake", ru: "Чизкейк Сан-Себастьян" } },
  { slug: "baileys-tiramisu", kind: "FOOD", category: "desserts", title: { tr: "Bailey's Tiramisu", en: "Bailey's Tiramisu" } },
  { slug: "meyve-tabagi", kind: "FOOD", category: "desserts", title: { tr: "Meyve Tabağı", en: "Fruit Plate" } },

  { slug: "aperol-spritz", kind: "DRINK", category: "cocktails", tag: "Cocktail", title: { tr: "Aperol Spritz", en: "Aperol Spritz" } },
  { slug: "mojito", kind: "DRINK", category: "cocktails", tag: "Cocktail", title: { tr: "Mojito", en: "Mojito" } },
  { slug: "negroni", kind: "DRINK", category: "cocktails", tag: "Cocktail", title: { tr: "Negroni", en: "Negroni" } },
  { slug: "margarita", kind: "DRINK", category: "cocktails", tag: "Cocktail", title: { tr: "Margarita", en: "Margarita" } },

  // ── DEMO drinks (placeholder, NOT evidenced) ──────────────────────────────
  // Structurally faithful to the legacy drink displays so the UI works: beers
  // show a serving cl; wines show bottle/glass + a DLC (label) badge; spirits are
  // grouped by `tag` sub-category (Viski/Rakı/…) with multi-cl pricing; soft
  // drinks use colour chips. Replace names/prices with the real list (U5).
  { slug: "fici-bira", kind: "DRINK", category: "beers", tag: "Beer", title: { tr: "Fıçı Bira", en: "Draft Beer" } },
  { slug: "sise-bira", kind: "DRINK", category: "beers", tag: "Beer", title: { tr: "Şişe Bira", en: "Bottled Beer" } },

  { slug: "kirmizi-sarap-ev", kind: "DRINK", category: "wines", title: { tr: "Ev Şarabı (Kırmızı)", en: "House Wine (Red)" } },
  { slug: "beyaz-sarap-ev", kind: "DRINK", category: "wines", title: { tr: "Ev Şarabı (Beyaz)", en: "House Wine (White)" } },
  { slug: "kirmizi-sarap-sise", kind: "DRINK", category: "wines", title: { tr: "Kırmızı Şarap (Şişe)", en: "Red Wine (Bottle)" } },

  { slug: "viski-standart", kind: "DRINK", category: "hard-drinks", tag: "Viski", title: { tr: "Viski (Standart)", en: "Whisky (Standard)" } },
  { slug: "viski-premium", kind: "DRINK", category: "hard-drinks", tag: "Viski", title: { tr: "Viski (Premium)", en: "Whisky (Premium)" } },
  { slug: "raki", kind: "DRINK", category: "hard-drinks", tag: "Rakı", title: { tr: "Rakı", en: "Rakı" } },
  { slug: "raki-ozel", kind: "DRINK", category: "hard-drinks", tag: "Rakı", title: { tr: "Rakı (Özel Seri)", en: "Rakı (Special)" } },
  { slug: "votka", kind: "DRINK", category: "hard-drinks", tag: "Votka", title: { tr: "Votka", en: "Vodka" } },
  { slug: "cin", kind: "DRINK", category: "hard-drinks", tag: "Cin", title: { tr: "Cin", en: "Gin" } },

  { slug: "kola", kind: "DRINK", category: "soft-drinks", title: { tr: "Kola", en: "Cola" } },
  { slug: "soda", kind: "DRINK", category: "soft-drinks", title: { tr: "Soda", en: "Sparkling Water" } },
  { slug: "ayran", kind: "DRINK", category: "soft-drinks", title: { tr: "Ayran", en: "Ayran" } },
  { slug: "su", kind: "DRINK", category: "soft-drinks", title: { tr: "Su", en: "Water" } },

  { slug: "serpme-kahvalti", kind: "FOOD", category: "breakfast", title: { tr: "Serpme Kahvaltı", en: "Turkish Breakfast", ru: "Турецкий завтрак" } },
  { slug: "mono-kahvalti", kind: "FOOD", category: "breakfast", title: { tr: "Mono Kahvaltı", en: "Mono Breakfast" } },
  { slug: "pankek", kind: "FOOD", category: "breakfast", title: { tr: "Pankek", en: "Pancakes" } },
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
const HIDDEN_BY_VENUE: Record<string, string[]> = {
  terrace: ["vegan-wrap"], //  Vegan Wrap only on Garden's menu
  garden: ["cheeseburger"], // Cheeseburger only on Terrace's menu
};

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
      // Terrace-only categories (Garden's menu omits them entirely).
      { category: "snacks", sortOrder: 12 },
      { category: "hookah", sortOrder: 13 },
      { category: "breakfast", sortOrder: 14, visible: true }, // breakfast = Terrace only
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
      { category: "breakfast", sortOrder: 12, visible: false }, // Garden has no breakfast
    ],
  },
];

async function main() {
  const business = await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: {},
    create: { id: BUSINESS_ID, name: "Mono" },
  });

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
    for (const [locale, title] of Object.entries(p.title)) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: prod.id, locale } },
        update: { title },
        create: { productId: prod.id, locale, title },
      });
    }
  }

  // Reconcile: the seed is the single source of content (no admin), so remove any
  // product no longer listed here. Cascades to its menu items / translations /
  // prices. This is what lets deleting a product from the seed remove it in prod.
  await prisma.product.deleteMany({
    where: { businessId: business.id, slug: { notIn: PRODUCTS.map((p) => p.slug) } },
  });

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
      // Reconcile: the PRICES map is authoritative — drop any stale measure rows
      // whose label is no longer listed (e.g. after renaming Şişe→BOTTLE), so
      // re-seeding never leaves duplicate/old measures behind.
      await prisma.menuItemPrice.deleteMany({
        where: {
          menuItemId: menuItem.id,
          label: { notIn: options ? options.map((o) => o.label) : [] },
        },
      });
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

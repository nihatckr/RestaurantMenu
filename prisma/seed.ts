import { PrismaClient, ProductKind } from "@prisma/client";

const prisma = new PrismaClient();

// Idempotent seed (re-runnable). Two venues sharing one catalog (U11 = two
// venues). Content is grounded in legacy evidence: product names come from the
// legacy asset folders (real menu items) and the category set mirrors the legacy
// structure. Per-venue differences (Terrace hides Breakfast; drink ordering
// differs) are DATA, never code (AGENTS.md 10).
//
// PRICES ARE PLACEHOLDERS pending a real source (DATA_SOURCING.md / U5) — flagged
// here, not treated as product truth (AGENTS.md 5–6). Managed via seed data; no
// admin UI (T11 = seed-data).

const BUSINESS_ID = "mono";

type Tr = { tr: string; en?: string; ru?: string };

const CATEGORIES: { slug: string; name: Tr }[] = [
  { slug: "starters", name: { tr: "Başlangıçlar", en: "Starters", ru: "Закуски" } },
  { slug: "salads", name: { tr: "Salatalar", en: "Salads", ru: "Салаты" } },
  { slug: "pastas", name: { tr: "Makarnalar", en: "Pastas", ru: "Паста" } },
  { slug: "wraps-burgers", name: { tr: "Sandviç & Burger", en: "Wraps & Burgers", ru: "Сэндвичи и бургеры" } },
  { slug: "main-courses", name: { tr: "Ana Yemekler", en: "Main Courses", ru: "Основные блюда" } },
  { slug: "desserts", name: { tr: "Tatlılar", en: "Desserts", ru: "Десерты" } },
  { slug: "cocktails", name: { tr: "Kokteyller", en: "Cocktails", ru: "Коктейли" } },
  { slug: "beers", name: { tr: "Biralar", en: "Beers", ru: "Пиво" } },
  { slug: "wines", name: { tr: "Şaraplar", en: "Wines", ru: "Вина" } },
  { slug: "hard-drinks", name: { tr: "Alkollü İçecekler", en: "Spirits", ru: "Крепкие напитки" } },
  { slug: "soft-drinks", name: { tr: "Soft İçecekler", en: "Soft Drinks", ru: "Безалкогольные" } },
  { slug: "breakfast", name: { tr: "Kahvaltı", en: "Breakfast", ru: "Завтрак" } },
];

type ProductSeed = {
  slug: string;
  kind: ProductKind;
  category: string;
  price: number; // PLACEHOLDER (U5)
  tag?: string;
  title: Tr;
};

const PRODUCTS: ProductSeed[] = [
  // Starters
  { slug: "kalamar", kind: "FOOD", category: "starters", price: 320, title: { tr: "Kalamar", en: "Calamari" } },
  { slug: "falafel", kind: "FOOD", category: "starters", price: 220, title: { tr: "Falafel", en: "Falafel" } },
  { slug: "karisik-kizartma", kind: "FOOD", category: "starters", price: 240, title: { tr: "Karışık Kızartma", en: "Mixed Fries" } },
  { slug: "spring-rolls", kind: "FOOD", category: "starters", price: 260, title: { tr: "Spring Rolls", en: "Spring Rolls" } },
  // Salads
  { slug: "roka-salatasi", kind: "FOOD", category: "salads", price: 220, title: { tr: "Roka Salatası", en: "Arugula Salad", ru: "Салат из рукколы" } },
  { slug: "mono-fit", kind: "FOOD", category: "salads", price: 280, title: { tr: "Mono Fit", en: "Mono Fit Salad" } },
  { slug: "tavuklu-sezar", kind: "FOOD", category: "salads", price: 300, title: { tr: "Tavuklu Sezar Salata", en: "Chicken Caesar Salad" } },
  // Pastas
  { slug: "spagetti-bolognese", kind: "FOOD", category: "pastas", price: 340, title: { tr: "Spagetti Bolognese", en: "Spaghetti Bolognese" } },
  { slug: "fettucini-alfredo", kind: "FOOD", category: "pastas", price: 330, title: { tr: "Fettucini Alfredo", en: "Fettuccine Alfredo" } },
  { slug: "penne-arabiata", kind: "FOOD", category: "pastas", price: 320, title: { tr: "Penne Arabiata", en: "Penne Arrabbiata" } },
  { slug: "manti", kind: "FOOD", category: "pastas", price: 290, title: { tr: "Mantı", en: "Turkish Mantı" } },
  // Wraps & Burgers
  { slug: "mono-burger", kind: "FOOD", category: "wraps-burgers", price: 480, title: { tr: "Mono Burger", en: "Mono Burger", ru: "Моно Бургер" } },
  { slug: "cheeseburger", kind: "FOOD", category: "wraps-burgers", price: 440, title: { tr: "Cheeseburger", en: "Cheeseburger" } },
  { slug: "vegan-wrap", kind: "FOOD", category: "wraps-burgers", price: 360, title: { tr: "Vegan Wrap", en: "Vegan Wrap" } },
  { slug: "tavuklu-quesedilla", kind: "FOOD", category: "wraps-burgers", price: 380, title: { tr: "Tavuklu Quesadilla", en: "Chicken Quesadilla" } },
  // Main Courses
  { slug: "dana-antrikot", kind: "FOOD", category: "main-courses", price: 720, title: { tr: "Dana Antrikot", en: "Beef Entrecôte" } },
  { slug: "somon-izgara", kind: "FOOD", category: "main-courses", price: 560, title: { tr: "Somon Izgara", en: "Grilled Salmon" } },
  { slug: "kuzu-incik", kind: "FOOD", category: "main-courses", price: 640, title: { tr: "Kuzu İncik", en: "Lamb Shank" } },
  { slug: "cokertme-kebabi", kind: "FOOD", category: "main-courses", price: 520, title: { tr: "Çökertme Kebabı", en: "Çökertme Kebab" } },
  // Desserts
  { slug: "san-sebastian", kind: "FOOD", category: "desserts", price: 260, title: { tr: "San Sebastian Cheesecake", en: "San Sebastian Cheesecake", ru: "Чизкейк Сан-Себастьян" } },
  { slug: "baileys-tiramisu", kind: "FOOD", category: "desserts", price: 240, title: { tr: "Bailey's Tiramisu", en: "Bailey's Tiramisu" } },
  { slug: "meyve-tabagi", kind: "FOOD", category: "desserts", price: 300, title: { tr: "Meyve Tabağı", en: "Fruit Plate" } },
  // Cocktails
  { slug: "aperol-spritz", kind: "DRINK", category: "cocktails", price: 420, tag: "Cocktail", title: { tr: "Aperol Spritz", en: "Aperol Spritz" } },
  { slug: "mojito", kind: "DRINK", category: "cocktails", price: 400, tag: "Cocktail", title: { tr: "Mojito", en: "Mojito" } },
  { slug: "negroni", kind: "DRINK", category: "cocktails", price: 440, tag: "Cocktail", title: { tr: "Negroni", en: "Negroni" } },
  { slug: "margarita", kind: "DRINK", category: "cocktails", price: 420, tag: "Cocktail", title: { tr: "Margarita", en: "Margarita" } },
  // Beers
  { slug: "efes", kind: "DRINK", category: "beers", price: 180, tag: "Beer", title: { tr: "Efes", en: "Efes" } },
  { slug: "bomonti", kind: "DRINK", category: "beers", price: 190, tag: "Beer", title: { tr: "Bomonti", en: "Bomonti" } },
  // Wines
  { slug: "ev-sarabi-kirmizi", kind: "DRINK", category: "wines", price: 320, tag: "Wine", title: { tr: "Ev Şarabı (Kırmızı)", en: "House Wine (Red)" } },
  { slug: "ev-sarabi-beyaz", kind: "DRINK", category: "wines", price: 320, tag: "Wine", title: { tr: "Ev Şarabı (Beyaz)", en: "House Wine (White)" } },
  // Hard drinks
  { slug: "raki", kind: "DRINK", category: "hard-drinks", price: 260, tag: "Spirit", title: { tr: "Rakı", en: "Rakı" } },
  { slug: "viski", kind: "DRINK", category: "hard-drinks", price: 340, tag: "Spirit", title: { tr: "Viski", en: "Whisky" } },
  // Soft drinks
  { slug: "cola", kind: "DRINK", category: "soft-drinks", price: 90, tag: "Soft", title: { tr: "Coca-Cola", en: "Coca-Cola", ru: "Кока-Кола" } },
  { slug: "ayran", kind: "DRINK", category: "soft-drinks", price: 60, tag: "Soft", title: { tr: "Ayran", en: "Ayran" } },
  { slug: "su", kind: "DRINK", category: "soft-drinks", price: 40, tag: "Soft", title: { tr: "Su", en: "Water" } },
  // Breakfast
  { slug: "serpme-kahvalti", kind: "FOOD", category: "breakfast", price: 650, title: { tr: "Serpme Kahvaltı", en: "Turkish Breakfast", ru: "Турецкий завтрак" } },
  { slug: "mono-kahvalti", kind: "FOOD", category: "breakfast", price: 480, title: { tr: "Mono Kahvaltı", en: "Mono Breakfast" } },
  { slug: "pankek", kind: "FOOD", category: "breakfast", price: 220, title: { tr: "Pankek", en: "Pancakes" } },
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
  "serpme-kahvalti": "/products/serpme-kahvalti.png",
  "mono-kahvalti": "/products/mono-kahvalti.png",
  pankek: "/products/pankek.png",
};

// Multi-measure pricing (legacy Hard Drinks / wine glass-bottle). Items listed
// here use these labelled measures instead of a single price. DEMO amounts (U5).
const PRICE_OPTIONS_BY_SLUG: Record<string, { label: string; amount: number }[]> = {
  raki: [
    { label: "5 CL", amount: 260 },
    { label: "Şişe", amount: 1400 },
  ],
  viski: [
    { label: "4 CL", amount: 340 },
    { label: "8 CL", amount: 620 },
  ],
  "ev-sarabi-kirmizi": [
    { label: "Kadeh", amount: 320 },
    { label: "Şişe", amount: 1100 },
  ],
  "ev-sarabi-beyaz": [
    { label: "Kadeh", amount: 320 },
    { label: "Şişe", amount: 1100 },
  ],
};

// Per-venue category order + visibility. Terrace hides Breakfast; drink order
// differs (Terrace: Beers→Wines; Garden: Wines→…→Beers).
type VenueSeed = {
  slug: string;
  name: string;
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
    sortOrder: 1,
    order: [
      ...FOOD_ORDER.map((category, i) => ({ category, sortOrder: i + 1 })),
      { category: "cocktails", sortOrder: 7 },
      { category: "beers", sortOrder: 8 },
      { category: "wines", sortOrder: 9 },
      { category: "hard-drinks", sortOrder: 10 },
      { category: "soft-drinks", sortOrder: 11 },
      { category: "breakfast", sortOrder: 12, visible: false },
    ],
  },
  {
    slug: "garden",
    name: "Mono Garden",
    sortOrder: 2,
    order: [
      ...FOOD_ORDER.map((category, i) => ({ category, sortOrder: i + 1 })),
      { category: "cocktails", sortOrder: 7 },
      { category: "wines", sortOrder: 8 },
      { category: "soft-drinks", sortOrder: 9 },
      { category: "beers", sortOrder: 10 },
      { category: "hard-drinks", sortOrder: 11 },
      { category: "breakfast", sortOrder: 12, visible: true },
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
      update: {},
      create: { businessId: business.id, slug: c.slug },
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
    const prod = await prisma.product.upsert({
      where: { businessId_slug: { businessId: business.id, slug: p.slug } },
      update: { kind: p.kind, tag: p.tag ?? null, image },
      create: { businessId: business.id, slug: p.slug, kind: p.kind, tag: p.tag ?? null, image },
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

  for (const v of VENUES) {
    const venue = await prisma.venue.upsert({
      where: { slug: v.slug },
      update: { name: v.name, sortOrder: v.sortOrder, businessId: business.id },
      create: { slug: v.slug, name: v.name, sortOrder: v.sortOrder, businessId: business.id },
    });
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

    // Every product is offered in both venues (shared catalog), grouped by its
    // category, ordered by its position within the category.
    const orderByCategory = new Map<string, number>();
    for (const p of PRODUCTS) {
      const productId = productIdBySlug.get(p.slug)!;
      const categoryId = categoryIdBySlug.get(p.category)!;
      const order = orderByCategory.get(p.category) ?? 0;
      orderByCategory.set(p.category, order + 1);
      const options = PRICE_OPTIONS_BY_SLUG[p.slug];
      // Multi-measure items carry their prices in MenuItemPrice; leave the single
      // price null so there is one source of truth.
      const price = options ? null : p.price;
      const menuItem = await prisma.menuItem.upsert({
        where: { menuId_productId: { menuId: menu.id, productId } },
        update: { categoryId, price, sortOrder: order },
        create: { menuId: menu.id, productId, categoryId, price, sortOrder: order },
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

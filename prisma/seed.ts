import { PrismaClient, ProductKind } from "@prisma/client";

const prisma = new PrismaClient();

// Idempotent seed (re-runnable). Two venues sharing one catalog (decision: U11 =
// two venues). Per-venue differences (Terrace hides Breakfast; drink ordering
// differs) are expressed as DATA, never code (AGENTS.md 10).
//
// Prices are example placeholders pending a real source (DATA_SOURCING.md / U5) —
// flagged here, not treated as product truth (AGENTS.md 5–6).

const BUSINESS_ID = "mono";

type Tr = { tr: string; en?: string; ru?: string };

const CATEGORIES: { slug: string; name: Tr }[] = [
  { slug: "starters", name: { tr: "Başlangıçlar", en: "Starters", ru: "Закуски" } },
  { slug: "salads", name: { tr: "Salatalar", en: "Salads", ru: "Салаты" } },
  { slug: "main-courses", name: { tr: "Ana Yemekler", en: "Main Courses", ru: "Основные блюда" } },
  { slug: "desserts", name: { tr: "Tatlılar", en: "Desserts", ru: "Десерты" } },
  { slug: "cocktails", name: { tr: "Kokteyller", en: "Cocktails", ru: "Коктейли" } },
  { slug: "beers", name: { tr: "Biralar", en: "Beers", ru: "Пиво" } },
  { slug: "wines", name: { tr: "Şaraplar", en: "Wines", ru: "Вина" } },
  { slug: "soft-drinks", name: { tr: "Soft İçecekler", en: "Soft Drinks", ru: "Безалкогольные" } },
  { slug: "breakfast", name: { tr: "Kahvaltı", en: "Breakfast", ru: "Завтрак" } },
];

const PRODUCTS: {
  slug: string;
  kind: ProductKind;
  category: string;
  price: number;
  tag?: string;
  title: Tr;
}[] = [
  { slug: "roka-salatasi", kind: "FOOD", category: "salads", price: 220, title: { tr: "Roka Salatası", en: "Arugula Salad", ru: "Салат из рукколы" } },
  { slug: "mono-burger", kind: "FOOD", category: "main-courses", price: 480, title: { tr: "Mono Burger", en: "Mono Burger", ru: "Моно Бургер" } },
  { slug: "san-sebastian", kind: "FOOD", category: "desserts", price: 260, title: { tr: "San Sebastian Cheesecake", en: "San Sebastian Cheesecake", ru: "Чизкейк Сан-Себастьян" } },
  { slug: "aperol-spritz", kind: "DRINK", category: "cocktails", price: 420, tag: "Cocktail", title: { tr: "Aperol Spritz", en: "Aperol Spritz", ru: "Апероль Шприц" } },
  { slug: "efes", kind: "DRINK", category: "beers", price: 180, tag: "Beer", title: { tr: "Efes", en: "Efes", ru: "Эфес" } },
  { slug: "cola", kind: "DRINK", category: "soft-drinks", price: 90, tag: "Soft", title: { tr: "Coca-Cola", en: "Coca-Cola", ru: "Кока-Кола" } },
  { slug: "serpme-kahvalti", kind: "FOOD", category: "breakfast", price: 650, title: { tr: "Serpme Kahvaltı", en: "Turkish Breakfast", ru: "Турецкий завтрак" } },
];

// Per-venue category order + visibility. Terrace hides Breakfast; drink order
// differs (Terrace: Beer→Wines→Soft; Garden: Wines→Soft→Beer).
const VENUES: {
  slug: string;
  name: string;
  sortOrder: number;
  order: { category: string; sortOrder: number; visible?: boolean }[];
}[] = [
  {
    slug: "terrace",
    name: "Mono Terrace",
    sortOrder: 1,
    order: [
      { category: "starters", sortOrder: 1 },
      { category: "salads", sortOrder: 2 },
      { category: "main-courses", sortOrder: 3 },
      { category: "desserts", sortOrder: 4 },
      { category: "cocktails", sortOrder: 5 },
      { category: "beers", sortOrder: 6 },
      { category: "wines", sortOrder: 7 },
      { category: "soft-drinks", sortOrder: 8 },
      { category: "breakfast", sortOrder: 9, visible: false },
    ],
  },
  {
    slug: "garden",
    name: "Mono Garden",
    sortOrder: 2,
    order: [
      { category: "starters", sortOrder: 1 },
      { category: "salads", sortOrder: 2 },
      { category: "main-courses", sortOrder: 3 },
      { category: "desserts", sortOrder: 4 },
      { category: "cocktails", sortOrder: 5 },
      { category: "wines", sortOrder: 6 },
      { category: "soft-drinks", sortOrder: 7 },
      { category: "beers", sortOrder: 8 },
      { category: "breakfast", sortOrder: 9, visible: true },
    ],
  },
];

async function main() {
  const business = await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: {},
    create: { id: BUSINESS_ID, name: "Mono" },
  });

  // Categories + translations
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

  // Products + translations
  const productBySlug = new Map<string, { id: string; category: string; price: number }>();
  for (const p of PRODUCTS) {
    const prod = await prisma.product.upsert({
      where: { businessId_slug: { businessId: business.id, slug: p.slug } },
      update: { kind: p.kind, tag: p.tag ?? null },
      create: { businessId: business.id, slug: p.slug, kind: p.kind, tag: p.tag ?? null },
    });
    productBySlug.set(p.slug, { id: prod.id, category: p.category, price: p.price });
    for (const [locale, title] of Object.entries(p.title)) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: prod.id, locale } },
        update: { title },
        create: { productId: prod.id, locale, title },
      });
    }
  }

  // Venues + menus + per-venue categories + items
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

    // Every product is offered in both venues (shared catalog).
    let order = 0;
    for (const p of PRODUCTS) {
      const prod = productBySlug.get(p.slug)!;
      const categoryId = categoryIdBySlug.get(prod.category)!;
      await prisma.menuItem.upsert({
        where: { menuId_productId: { menuId: menu.id, productId: prod.id } },
        update: { categoryId, price: prod.price, sortOrder: order },
        create: { menuId: menu.id, productId: prod.id, categoryId, price: prod.price, sortOrder: order },
      });
      order += 1;
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

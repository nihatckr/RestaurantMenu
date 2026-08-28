import "server-only";
import { prisma } from "@/lib/db";

// Owner-facing backup (DECISIONS B.16): the whole menu flattened into slug-keyed
// rows, ready to write as an .xlsx. Images stay as URLs. The same shape is what
// the import will read back, so keep the columns stable.

export type CategoryRow = {
  slug: string;
  nameTr: string;
  nameEn: string;
  nameRu: string;
  columns: number | "";
};

export type ProductRow = {
  slug: string;
  kind: string;
  tag: string;
  image: string;
  titleTr: string;
  titleEn: string;
  titleRu: string;
  descTr: string;
  descEn: string;
  descRu: string;
  calories: number | "";
  dietary: string; // pipe-joined tags, e.g. "vegan|halal"
};

export type ItemRow = {
  venueSlug: string;
  categorySlug: string;
  productSlug: string;
  price: number | "";
  available: boolean;
  sortOrder: number;
  featured: boolean;
  // "Kadeh:340|Şişe:1400" — labelled measures, or "" for a single/no price.
  measures: string;
};

export type BackupData = {
  categories: CategoryRow[];
  products: ProductRow[];
  items: ItemRow[];
};

// Sheet name → ordered column keys. Shared by export and (later) import so the
// two never drift.
export const SHEETS = {
  Categories: ["slug", "nameTr", "nameEn", "nameRu", "columns"],
  Products: [
    "slug",
    "kind",
    "tag",
    "image",
    "titleTr",
    "titleEn",
    "titleRu",
    "descTr",
    "descEn",
    "descRu",
    "calories",
    "dietary",
  ],
  MenuItems: [
    "venueSlug",
    "categorySlug",
    "productSlug",
    "price",
    "available",
    "sortOrder",
    "featured",
    "measures",
  ],
} as const;

function byLocale(rows: { locale: string; [k: string]: unknown }[], field: string) {
  const map = Object.fromEntries(rows.map((r) => [r.locale, r[field]]));
  return {
    tr: (map.tr as string) ?? "",
    en: (map.en as string) ?? "",
    ru: (map.ru as string) ?? "",
  };
}

export async function getBackupData(): Promise<BackupData> {
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) return { categories: [], products: [], items: [] };

  const [categories, products, venues] = await Promise.all([
    prisma.category.findMany({
      where: { businessId: business.id, deletedAt: null },
      orderBy: { slug: "asc" },
      select: {
        slug: true,
        columns: true,
        translations: { select: { locale: true, name: true } },
      },
    }),
    prisma.product.findMany({
      where: { businessId: business.id, deletedAt: null },
      orderBy: { slug: "asc" },
      select: {
        slug: true,
        kind: true,
        tag: true,
        image: true,
        calories: true,
        dietary: true,
        translations: { select: { locale: true, title: true, description: true } },
      },
    }),
    prisma.venue.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        menu: {
          select: {
            items: {
              where: { product: { deletedAt: null }, category: { deletedAt: null } },
              orderBy: { sortOrder: "asc" },
              select: {
                price: true,
                available: true,
                sortOrder: true,
                featured: true,
                prices: {
                  orderBy: { sortOrder: "asc" },
                  select: { label: true, amount: true },
                },
                product: { select: { slug: true } },
                category: { select: { slug: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const categoryRows: CategoryRow[] = categories.map((c) => {
    const n = byLocale(c.translations, "name");
    return { slug: c.slug, nameTr: n.tr, nameEn: n.en, nameRu: n.ru, columns: c.columns ?? "" };
  });

  const productRows: ProductRow[] = products.map((p) => {
    const t = byLocale(p.translations, "title");
    const d = byLocale(p.translations, "description");
    return {
      slug: p.slug,
      kind: p.kind,
      tag: p.tag ?? "",
      image: p.image ?? "",
      titleTr: t.tr,
      titleEn: t.en,
      titleRu: t.ru,
      descTr: d.tr,
      descEn: d.en,
      descRu: d.ru,
      calories: p.calories ?? "",
      dietary: p.dietary.join("|"),
    };
  });

  const itemRows: ItemRow[] = [];
  for (const v of venues) {
    for (const it of v.menu?.items ?? []) {
      itemRows.push({
        venueSlug: v.slug,
        categorySlug: it.category.slug,
        productSlug: it.product.slug,
        price: it.price === null ? "" : Number(it.price),
        available: it.available,
        sortOrder: it.sortOrder,
        featured: it.featured,
        measures: it.prices.map((m) => `${m.label}:${Number(m.amount)}`).join("|"),
      });
    }
  }

  return { categories: categoryRows, products: productRows, items: itemRows };
}

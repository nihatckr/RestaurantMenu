import "server-only";
import { type ProductKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";
import { deleteImage } from "@/lib/images";
import { reorder, type MoveDirection } from "@/lib/reorder";
import type { CategoryInput, ProductInput } from "@/lib/schemas";

export type { MoveDirection };

// Admin write path for categories (ADMIN_PLAN.md §5). Prisma stays behind this
// data-access layer; the server actions call these after auth + zod. Admin reads are
// intentionally uncached (fresh), unlike the public `use cache` reads in menu.ts.

export type CategoryAdminRow = {
  id: string;
  slug: string;
  columns: number | null;
  visible: boolean;
  nameTr: string;
  nameEn: string;
  nameRu: string;
};

/** Categories in this venue's menu (non-deleted), with edit fields. */
export async function getCategoriesAdmin(
  venueSlug: string,
): Promise<CategoryAdminRow[]> {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: {
      menu: {
        select: {
          categories: {
            where: { category: { deletedAt: null } },
            orderBy: { sortOrder: "asc" },
            select: {
              visible: true,
              category: {
                select: {
                  id: true,
                  slug: true,
                  columns: true,
                  translations: { select: { locale: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  return (venue?.menu?.categories ?? []).map((mc) => {
    const t = Object.fromEntries(mc.category.translations.map((x) => [x.locale, x.name]));
    return {
      id: mc.category.id,
      slug: mc.category.slug,
      columns: mc.category.columns,
      visible: mc.visible,
      nameTr: t.tr ?? "",
      nameEn: t.en ?? "",
      nameRu: t.ru ?? "",
    };
  });
}

/** Move a category up/down in this venue's menu order. */
export async function moveCategory(
  venueSlug: string,
  categoryId: string,
  dir: MoveDirection,
) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { menu: { select: { id: true } } },
  });
  if (!venue?.menu) throw new Error("Venue menu not found");
  const rows = await prisma.menuCategory.findMany({
    where: { menuId: venue.menu.id, category: { deletedAt: null } },
    orderBy: { sortOrder: "asc" },
    select: { id: true, categoryId: true },
  });
  await reorder(
    rows.map((r) => ({ id: r.id, key: r.categoryId })),
    categoryId,
    dir,
    (id, sortOrder) => prisma.menuCategory.update({ where: { id }, data: { sortOrder } }),
  );
}

/** Show/hide a category in this venue's menu (per-venue MenuCategory.visible). */
export async function setCategoryVisibility(
  venueSlug: string,
  categoryId: string,
  visible: boolean,
) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { menu: { select: { id: true } } },
  });
  if (!venue?.menu) throw new Error("Venue menu not found");
  await prisma.menuCategory.updateMany({
    where: { menuId: venue.menu.id, categoryId },
    data: { visible },
  });
}

function translationRows(input: CategoryInput) {
  const rows = [{ locale: "tr", name: input.nameTr.trim() }];
  if (input.nameEn?.trim()) rows.push({ locale: "en", name: input.nameEn.trim() });
  if (input.nameRu?.trim()) rows.push({ locale: "ru", name: input.nameRu.trim() });
  return rows;
}

/** Create a category, auto-slug it, and link it to this venue's menu (appended,
 *  visible) so it appears immediately. */
export async function createCategory(venueSlug: string, input: CategoryInput) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { businessId: true, menu: { select: { id: true } } },
  });
  if (!venue?.menu) throw new Error("Venue menu not found");

  const taken = new Set(
    (
      await prisma.category.findMany({
        where: { businessId: venue.businessId },
        select: { slug: true },
      })
    ).map((c) => c.slug),
  );
  const slug = uniqueSlug(slugify(input.nameEn || input.nameTr), taken);
  const max = await prisma.menuCategory.aggregate({
    where: { menuId: venue.menu.id },
    _max: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      businessId: venue.businessId,
      slug,
      columns: input.columns ?? null,
      translations: { create: translationRows(input) },
      menuLinks: {
        create: {
          menuId: venue.menu.id,
          sortOrder: (max._max.sortOrder ?? 0) + 1,
          visible: true,
        },
      },
    },
  });
}

/** Update a category's columns + translations (blank en/ru removes that row). */
export async function updateCategory(id: string, input: CategoryInput) {
  await prisma.category.update({
    where: { id },
    data: { columns: input.columns ?? null },
  });
  const values: [string, string | undefined][] = [
    ["tr", input.nameTr],
    ["en", input.nameEn],
    ["ru", input.nameRu],
  ];
  for (const [locale, raw] of values) {
    const name = (raw ?? "").trim();
    if (name) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: id, locale } },
        update: { name },
        create: { categoryId: id, locale, name },
      });
    } else if (locale !== "tr") {
      await prisma.categoryTranslation.deleteMany({ where: { categoryId: id, locale } });
    }
  }
}

/** Soft-delete (trash) — hidden from the public menu, recoverable. */
export async function softDeleteCategory(id: string) {
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ── Trash (soft-deleted, recoverable) ────────────────────────────────────────

export type TrashItem = { id: string; name: string; deletedAt: string };

/** Trashed categories + products for the business (most-recent first). */
export async function getTrash(): Promise<{
  categories: TrashItem[];
  products: TrashItem[];
}> {
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) return { categories: [], products: [] };

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { businessId: business.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        deletedAt: true,
        translations: { select: { locale: true, name: true } },
      },
    }),
    prisma.product.findMany({
      where: { businessId: business.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        slug: true,
        deletedAt: true,
        translations: { select: { locale: true, title: true } },
      },
    }),
  ]);

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name:
        c.translations.find((t) => t.locale === "tr")?.name ??
        c.translations[0]?.name ??
        "—",
      deletedAt: c.deletedAt!.toISOString(),
    })),
    products: products.map((p) => ({
      id: p.id,
      name:
        p.translations.find((t) => t.locale === "tr")?.title ??
        p.translations[0]?.title ??
        p.slug,
      deletedAt: p.deletedAt!.toISOString(),
    })),
  };
}

/** Restore (un-trash) a category — reappears in every venue that still links it. */
export async function restoreCategory(id: string) {
  await prisma.category.update({ where: { id }, data: { deletedAt: null } });
}

/** Restore (un-trash) a product. */
export async function restoreProduct(id: string) {
  await prisma.product.update({ where: { id }, data: { deletedAt: null } });
}

/** Permanently delete everything in the trash (irreversible). Deletes trashed
 *  products (cascades their menu items/translations/prices) and trashed
 *  categories (after clearing any remaining menu items that reference them), then
 *  best-effort removes the products' images. Returns how many were purged. */
export async function emptyTrash(): Promise<{ categories: number; products: number }> {
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) return { categories: 0, products: 0 };

  const trashedCats = await prisma.category.findMany({
    where: { businessId: business.id, deletedAt: { not: null } },
    select: { id: true },
  });
  const trashedProds = await prisma.product.findMany({
    where: { businessId: business.id, deletedAt: { not: null } },
    select: { id: true, image: true },
  });
  const catIds = trashedCats.map((c) => c.id);

  await prisma.$transaction([
    // Free the category FK: drop any menu items still pointing at trashed categories.
    prisma.menuItem.deleteMany({ where: { categoryId: { in: catIds } } }),
    // Trashed products cascade their remaining menu items/translations/prices.
    prisma.product.deleteMany({
      where: { businessId: business.id, deletedAt: { not: null } },
    }),
    // Trashed categories cascade their menu links + translations.
    prisma.category.deleteMany({
      where: { businessId: business.id, deletedAt: { not: null } },
    }),
  ]);

  for (const p of trashedProds) await deleteImage(p.image);
  return { categories: trashedCats.length, products: trashedProds.length };
}

// ── Products ────────────────────────────────────────────────────────────────

export type ProductAdminRow = {
  id: string;
  titleTr: string;
  titleEn: string;
  titleRu: string;
  descriptionTr: string;
  descriptionEn: string;
  descriptionRu: string;
  calories: number | null;
  dietary: string[]; // raw diet/allergen tags (for the form checkboxes)
  categorySlug: string;
  kind: ProductKind;
  tag: string;
  image: string | null;
  price: number | null;
  prices: { label: string; amount: number }[]; // labelled measures (empty = single price)
};

/** Distinct product tags (sub-group names) in use, for the product form's picker. */
export async function getProductTags(): Promise<string[]> {
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) return [];
  const rows = await prisma.product.findMany({
    where: { businessId: business.id, deletedAt: null, tag: { not: null } },
    select: { tag: true },
    distinct: ["tag"],
    orderBy: { tag: "asc" },
  });
  return rows.map((r) => r.tag).filter((t): t is string => !!t);
}

/** Category options (slug + Turkish name) for the product form's picker. */
export async function getCategoryOptions(
  venueSlug: string,
): Promise<{ slug: string; nameTr: string }[]> {
  const rows = await getCategoriesAdmin(venueSlug);
  return rows.map((c) => ({ slug: c.slug, nameTr: c.nameTr || c.slug }));
}

/** Products in this venue's menu (non-deleted), with edit fields + this venue's price. */
export async function getProductsAdmin(
  venueSlug: string,
): Promise<ProductAdminRow[]> {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: {
      menu: {
        select: {
          items: {
            where: { product: { deletedAt: null } },
            orderBy: { sortOrder: "asc" },
            select: {
              price: true,
              prices: {
                orderBy: { sortOrder: "asc" },
                select: { label: true, amount: true },
              },
              category: { select: { slug: true } },
              product: {
                select: {
                  id: true,
                  kind: true,
                  tag: true,
                  image: true,
                  calories: true,
                  dietary: true,
                  translations: {
                    select: { locale: true, title: true, description: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  return (venue?.menu?.items ?? []).map((it) => {
    const t = Object.fromEntries(it.product.translations.map((x) => [x.locale, x.title]));
    const d = Object.fromEntries(
      it.product.translations.map((x) => [x.locale, x.description ?? ""]),
    );
    return {
      id: it.product.id,
      titleTr: t.tr ?? "",
      titleEn: t.en ?? "",
      titleRu: t.ru ?? "",
      descriptionTr: d.tr ?? "",
      descriptionEn: d.en ?? "",
      descriptionRu: d.ru ?? "",
      calories: it.product.calories,
      dietary: it.product.dietary,
      categorySlug: it.category.slug,
      kind: it.product.kind,
      tag: it.product.tag ?? "",
      image: it.product.image,
      price: it.price === null ? null : Number(it.price),
      prices: it.prices.map((p) => ({ label: p.label, amount: Number(p.amount) })),
    };
  });
}

function titleRows(input: ProductInput) {
  const mk = (locale: string, title: string, description?: string) => ({
    locale,
    title: title.trim(),
    description: description?.trim() || null,
  });
  const rows = [mk("tr", input.titleTr, input.descriptionTr)];
  if (input.titleEn?.trim()) rows.push(mk("en", input.titleEn, input.descriptionEn));
  if (input.titleRu?.trim()) rows.push(mk("ru", input.titleRu, input.descriptionRu));
  return rows;
}

/** Create a product + its translations and add it to this venue's menu (in the
 *  chosen category, appended, available) so it appears immediately. */
export async function createProduct(
  venueSlug: string,
  input: ProductInput,
  image?: string | null,
) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { businessId: true, menu: { select: { id: true } } },
  });
  if (!venue?.menu) throw new Error("Venue menu not found");
  const category = await prisma.category.findFirst({
    where: { businessId: venue.businessId, slug: input.categorySlug, deletedAt: null },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found");

  const taken = new Set(
    (
      await prisma.product.findMany({
        where: { businessId: venue.businessId },
        select: { slug: true },
      })
    ).map((p) => p.slug),
  );
  const slug = uniqueSlug(slugify(input.titleEn || input.titleTr), taken);
  const max = await prisma.menuItem.aggregate({
    where: { menuId: venue.menu.id, categoryId: category.id },
    _max: { sortOrder: true },
  });

  const product = await prisma.product.create({
    data: {
      businessId: venue.businessId,
      slug,
      kind: input.kind as ProductKind,
      tag: input.tag?.trim() || null,
      image: image ?? null,
      calories: input.calories ?? null,
      dietary: input.dietary ?? [],
      translations: { create: titleRows(input) },
    },
  });
  const measures = input.prices ?? [];
  await prisma.menuItem.create({
    data: {
      menuId: venue.menu.id,
      productId: product.id,
      categoryId: category.id,
      // Measures supersede the single price (schema comment: leave price null).
      price: measures.length ? null : (input.price ?? null),
      available: true,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
      prices: measures.length
        ? { create: measures.map((m, i) => ({ label: m.label, amount: m.amount, sortOrder: i })) }
        : undefined,
    },
  });
}

/** Update a product's identity + this venue's category/price. */
export async function updateProduct(
  productId: string,
  venueSlug: string,
  input: ProductInput,
  // undefined = leave image unchanged; string = new URL; null = remove.
  image?: string | null,
) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { businessId: true, menu: { select: { id: true } } },
  });
  if (!venue?.menu) throw new Error("Venue menu not found");
  const category = await prisma.category.findFirst({
    where: { businessId: venue.businessId, slug: input.categorySlug, deletedAt: null },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found");

  // When the image changes, delete the old blob (best-effort) after the write.
  let oldImage: string | null = null;
  if (image !== undefined) {
    oldImage = (
      await prisma.product.findUnique({
        where: { id: productId },
        select: { image: true },
      })
    )?.image ?? null;
  }
  await prisma.product.update({
    where: { id: productId },
    data: {
      kind: input.kind as ProductKind,
      tag: input.tag?.trim() || null,
      calories: input.calories ?? null,
      dietary: input.dietary ?? [],
      ...(image !== undefined ? { image } : {}),
    },
  });
  if (image !== undefined && oldImage && oldImage !== image) {
    await deleteImage(oldImage);
  }
  const values: [string, string | undefined, string | undefined][] = [
    ["tr", input.titleTr, input.descriptionTr],
    ["en", input.titleEn, input.descriptionEn],
    ["ru", input.titleRu, input.descriptionRu],
  ];
  for (const [locale, rawTitle, rawDesc] of values) {
    const title = (rawTitle ?? "").trim();
    const description = (rawDesc ?? "").trim() || null;
    if (title) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId, locale } },
        update: { title, description },
        create: { productId, locale, title, description },
      });
    } else if (locale !== "tr") {
      await prisma.productTranslation.deleteMany({ where: { productId, locale } });
    }
  }
  // Replace this venue's menu-item facts (category, price/measures). Prices are a
  // full replace: clear then recreate from the form.
  const item = await prisma.menuItem.findFirst({
    where: { menuId: venue.menu.id, productId },
    select: { id: true },
  });
  if (item) {
    const measures = input.prices ?? [];
    await prisma.menuItemPrice.deleteMany({ where: { menuItemId: item.id } });
    await prisma.menuItem.update({
      where: { id: item.id },
      data: {
        categoryId: category.id,
        price: measures.length ? null : (input.price ?? null),
        prices: measures.length
          ? { create: measures.map((m, i) => ({ label: m.label, amount: m.amount, sortOrder: i })) }
          : undefined,
      },
    });
  }
}

/** Soft-delete (trash) a product — hidden from the public menu, recoverable. */
export async function softDeleteProduct(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date() },
  });
}

/** Move a product up/down within its category in this venue's menu. */
export async function moveProduct(
  venueSlug: string,
  productId: string,
  dir: MoveDirection,
) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { menu: { select: { id: true } } },
  });
  if (!venue?.menu) throw new Error("Venue menu not found");
  const target = await prisma.menuItem.findFirst({
    where: { menuId: venue.menu.id, productId, product: { deletedAt: null } },
    select: { categoryId: true },
  });
  if (!target) return;
  const rows = await prisma.menuItem.findMany({
    where: {
      menuId: venue.menu.id,
      categoryId: target.categoryId,
      product: { deletedAt: null },
    },
    orderBy: { sortOrder: "asc" },
    select: { id: true, productId: true },
  });
  await reorder(
    rows.map((r) => ({ id: r.id, key: r.productId })),
    productId,
    dir,
    (id, sortOrder) => prisma.menuItem.update({ where: { id }, data: { sortOrder } }),
  );
}

/** Show/hide a product in this venue's menu (per-venue MenuItem.available). */
export async function setProductAvailability(
  venueSlug: string,
  productId: string,
  available: boolean,
) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { menu: { select: { id: true } } },
  });
  if (!venue?.menu) throw new Error("Venue menu not found");
  await prisma.menuItem.updateMany({
    where: { menuId: venue.menu.id, productId },
    data: { available },
  });
}

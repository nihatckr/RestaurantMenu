import "server-only";
import { Prisma, type ProductKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { CategoryInput, ProductInput } from "@/lib/schemas";

export type MoveDirection = "up" | "down";

// Move `key`'s row one slot up/down within `rows` (already in display order) and
// renumber every row's sortOrder to its new index — robust even if the current
// sortOrders are equal/duplicated. No-op at the edges. Callers pass a per-model
// `update`; all writes run in one transaction.
async function reorder(
  rows: { id: string; key: string }[],
  key: string,
  dir: MoveDirection,
  update: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const idx = rows.findIndex((r) => r.key === key);
  if (idx < 0) return;
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return; // already at the edge
  const next = [...rows];
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
  await prisma.$transaction(next.map((r, i) => update(r.id, i)));
}

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

// ── Products ────────────────────────────────────────────────────────────────

export type ProductAdminRow = {
  id: string;
  titleTr: string;
  titleEn: string;
  titleRu: string;
  categorySlug: string;
  kind: ProductKind;
  tag: string;
  price: number | null;
};

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
              category: { select: { slug: true } },
              product: {
                select: {
                  id: true,
                  kind: true,
                  tag: true,
                  translations: { select: { locale: true, title: true } },
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
    return {
      id: it.product.id,
      titleTr: t.tr ?? "",
      titleEn: t.en ?? "",
      titleRu: t.ru ?? "",
      categorySlug: it.category.slug,
      kind: it.product.kind,
      tag: it.product.tag ?? "",
      price: it.price === null ? null : Number(it.price),
    };
  });
}

function titleRows(input: ProductInput) {
  const rows = [{ locale: "tr", title: input.titleTr.trim() }];
  if (input.titleEn?.trim()) rows.push({ locale: "en", title: input.titleEn.trim() });
  if (input.titleRu?.trim()) rows.push({ locale: "ru", title: input.titleRu.trim() });
  return rows;
}

/** Create a product + its translations and add it to this venue's menu (in the
 *  chosen category, appended, available) so it appears immediately. */
export async function createProduct(venueSlug: string, input: ProductInput) {
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
      translations: { create: titleRows(input) },
    },
  });
  await prisma.menuItem.create({
    data: {
      menuId: venue.menu.id,
      productId: product.id,
      categoryId: category.id,
      price: input.price ?? null,
      available: true,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
}

/** Update a product's identity + this venue's category/price. */
export async function updateProduct(
  productId: string,
  venueSlug: string,
  input: ProductInput,
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

  await prisma.product.update({
    where: { id: productId },
    data: { kind: input.kind as ProductKind, tag: input.tag?.trim() || null },
  });
  const values: [string, string | undefined][] = [
    ["tr", input.titleTr],
    ["en", input.titleEn],
    ["ru", input.titleRu],
  ];
  for (const [locale, raw] of values) {
    const title = (raw ?? "").trim();
    if (title) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId, locale } },
        update: { title },
        create: { productId, locale, title },
      });
    } else if (locale !== "tr") {
      await prisma.productTranslation.deleteMany({ where: { productId, locale } });
    }
  }
  await prisma.menuItem.updateMany({
    where: { menuId: venue.menu.id, productId },
    data: { categoryId: category.id, price: input.price ?? null },
  });
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

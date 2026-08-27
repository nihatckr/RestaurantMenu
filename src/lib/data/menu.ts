import "server-only";
import { prisma } from "@/lib/db";
import { bilingual, DEFAULT_LOCALE, pickLocalized } from "@/lib/i18n";

// Thin, typed data-access layer (ARCHITECTURE.md). Components/pages call these
// functions; they never touch `prisma.*` directly. Reads are venue-scoped by
// slug — venue identity is data, never a code branch (AGENTS.md 10).
//
// Reads use `"use cache"` so the mostly-static menu renders as a cached/static
// shell (Cache Components). When admin edits land later, revalidate by tag.
// Functions return plain, serializable DTOs (localized strings) — safe across
// the cache boundary and decoupled from Prisma types.

export type VenueSummary = { slug: string; name: string; wordmark: string | null };
// `nameAlt` is the alternate-language name shown alongside the primary one
// (legacy showed both). Null when absent or identical.
export type CategoryLink = { slug: string; name: string; nameAlt: string | null };

/** All venue slugs, ordered — for generateStaticParams. */
export async function listVenueSlugs(): Promise<string[]> {
  "use cache";
  const venues = await prisma.venue.findMany({
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });
  return venues.map((v) => v.slug);
}

/** Venues for the root chooser, ordered. */
export async function listVenues(): Promise<VenueSummary[]> {
  "use cache";
  const venues = await prisma.venue.findMany({
    select: { slug: true, name: true, wordmark: true },
    orderBy: { sortOrder: "asc" },
  });
  return venues;
}

/** A single venue by slug, or null if it does not exist. */
export async function getVenueBySlug(slug: string): Promise<VenueSummary | null> {
  "use cache";
  return prisma.venue.findUnique({
    where: { slug },
    select: { slug: true, name: true, wordmark: true },
  });
}

/** Visible categories for a venue, in order, localized. */
export async function listVenueCategories(
  venueSlug: string,
  locale: string = DEFAULT_LOCALE,
): Promise<CategoryLink[]> {
  "use cache";
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: {
      menu: {
        select: {
          categories: {
            where: { visible: true },
            orderBy: { sortOrder: "asc" },
            select: {
              category: {
                select: {
                  slug: true,
                  translations: { select: { locale: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const cats = venue?.menu?.categories ?? [];
  return cats.map((mc) => {
    const { primary, secondary } = bilingual(mc.category.translations, (r) => r.name, locale);
    return {
      slug: mc.category.slug,
      name: primary || mc.category.slug,
      nameAlt: secondary,
    };
  });
}

export type PriceOption = { label: string; amount: number };

export type MenuItemView = {
  id: string;
  title: string;
  titleAlt: string | null; // alternate-language title (legacy showed both)
  subtitle: string | null;
  description: string | null;
  price: number | null;
  prices: PriceOption[]; // labelled measures (e.g. 4 CL / Kadeh); empty = single price
  image: string | null;
  color: string | null; // drink colour chip (legacy) — used by imageless drink rows
  kind: "FOOD" | "DRINK";
  tag: string | null;
};

export type MenuCategoryView = {
  slug: string;
  name: string;
  nameAlt: string | null;
  items: MenuItemView[];
};

/**
 * Full menu for a venue: visible categories in order, each with its available
 * items (ordered), localized, with Decimal prices converted to number so the
 * result is serializable across the cache boundary. Returns null if the venue
 * has no menu.
 */
export async function getVenueMenu(
  venueSlug: string,
  locale: string = DEFAULT_LOCALE,
): Promise<MenuCategoryView[] | null> {
  "use cache";
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: {
      menu: {
        select: {
          categories: {
            where: { visible: true },
            orderBy: { sortOrder: "asc" },
            select: {
              categoryId: true,
              category: {
                select: {
                  slug: true,
                  translations: { select: { locale: true, name: true } },
                },
              },
            },
          },
          items: {
            where: { available: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              price: true,
              categoryId: true,
              prices: {
                orderBy: { sortOrder: "asc" },
                select: { label: true, amount: true },
              },
              product: {
                select: {
                  image: true,
                  kind: true,
                  tag: true,
                  color: true,
                  translations: {
                    select: { locale: true, title: true, subtitle: true, description: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!venue?.menu) return null;

  const itemsByCategory = new Map<string, MenuItemView[]>();
  for (const item of venue.menu.items) {
    const t = pickLocalized(item.product.translations, locale);
    const title = bilingual(item.product.translations, (r) => r.title, locale);
    const view: MenuItemView = {
      id: item.id,
      title: title.primary,
      titleAlt: title.secondary,
      subtitle: t?.subtitle ?? null,
      description: t?.description ?? null,
      price: item.price === null ? null : Number(item.price),
      prices: item.prices.map((po) => ({ label: po.label, amount: Number(po.amount) })),
      image: item.product.image,
      color: item.product.color,
      kind: item.product.kind,
      tag: item.product.tag,
    };
    const bucket = itemsByCategory.get(item.categoryId) ?? [];
    bucket.push(view);
    itemsByCategory.set(item.categoryId, bucket);
  }

  return venue.menu.categories.map((mc) => {
    const name = bilingual(mc.category.translations, (r) => r.name, locale);
    return {
      slug: mc.category.slug,
      name: name.primary || mc.category.slug,
      nameAlt: name.secondary,
      items: itemsByCategory.get(mc.categoryId) ?? [],
    };
  });
}

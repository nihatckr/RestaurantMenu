import "server-only";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCALE, localized, pickLocalized } from "@/lib/i18n";

// Thin, typed data-access layer (ARCHITECTURE.md). Components/pages call these
// functions; they never touch `prisma.*` directly. Reads are venue-scoped by
// slug — venue identity is data, never a code branch (AGENTS.md 10).
//
// Reads use `"use cache"` so the mostly-static menu renders as a cached/static
// shell (Cache Components). When admin edits land later, revalidate by tag.
// Functions return plain, serializable DTOs (localized strings) — safe across
// the cache boundary and decoupled from Prisma types.

export type VenueSummary = { slug: string; name: string; wordmark: string | null };
// A category link, localized to the requested locale (single language — the
// locale comes from the route, `/[locale]/…`).
export type CategoryLink = {
  slug: string;
  name: string;
};

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
  return cats.map((mc) => ({
    slug: mc.category.slug,
    name: localized(mc.category.translations, (r) => r.name, locale) || mc.category.slug,
  }));
}

export type PriceOption = { label: string; amount: number };

// Lightweight EN translation of the controlled hard-drink `tag` vocabulary so the
// sub-category header localizes with the rest of the page. This is label i18n for
// a closed set, not menu content. Tags/locales without an entry fall back to the
// Turkish tag (there is no RU tag vocabulary yet — see I18N.md coverage note).
const TAG_EN: Record<string, string> = {
  Viski: "Whisky",
  Rakı: "Rakı",
  Votka: "Vodka",
  Cin: "Gin",
  Tekila: "Tequila",
  Rom: "Rum",
  Konyak: "Cognac",
  Likör: "Liqueur",
};

function tagLabel(tag: string, locale: string): string {
  return locale === "en" ? (TAG_EN[tag] ?? tag) : tag;
}

export type MenuItemView = {
  id: string;
  title: string; // localized to the requested locale (tr fallback)
  subtitle: string | null;
  description: string | null;
  price: number | null;
  prices: PriceOption[]; // labelled measures (e.g. 4 CL / Kadeh); empty = single price
  image: string | null;
  color: string | null; // drink colour chip (legacy) — used by imageless drink rows
  kind: "FOOD" | "DRINK";
  tag: string | null; // raw TR tag — the stable grouping key for sub-categories
  tagLabel: string | null; // localized tag name shown as the sub-header
  dlc: boolean; // wine has a valid label (legacy "DLC" badge)
  featured: boolean; // spans full width in its category (legacy featured breakfast)
};

export type MenuCategoryView = {
  slug: string;
  name: string; // localized to the requested locale (tr fallback)
  columns: number | null; // grid column override for photo cards (null = default)
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
                  columns: true,
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
              featured: true,
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
                  dlc: true,
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
    const view: MenuItemView = {
      id: item.id,
      title: localized(item.product.translations, (r) => r.title, locale) || "",
      subtitle: t?.subtitle ?? null,
      description: t?.description ?? null,
      price: item.price === null ? null : Number(item.price),
      prices: item.prices.map((po) => ({ label: po.label, amount: Number(po.amount) })),
      image: item.product.image,
      color: item.product.color,
      kind: item.product.kind,
      tag: item.product.tag,
      tagLabel: item.product.tag ? tagLabel(item.product.tag, locale) : null,
      dlc: item.product.dlc,
      featured: item.featured,
    };
    const bucket = itemsByCategory.get(item.categoryId) ?? [];
    bucket.push(view);
    itemsByCategory.set(item.categoryId, bucket);
  }

  return venue.menu.categories.map((mc) => ({
    slug: mc.category.slug,
    name: localized(mc.category.translations, (r) => r.name, locale) || mc.category.slug,
    columns: mc.category.columns,
    items: itemsByCategory.get(mc.categoryId) ?? [],
  }));
}

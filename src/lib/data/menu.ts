import "server-only";
import { cacheTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCALE, localized, pickLocalized } from "@/lib/i18n";
import { MENU_TAG, venueTag } from "@/lib/cache";

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
  cacheTag(MENU_TAG);
  const venues = await prisma.venue.findMany({
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });
  return venues.map((v) => v.slug);
}

/** Venues for the root chooser, ordered. */
export async function listVenues(): Promise<VenueSummary[]> {
  "use cache";
  cacheTag(MENU_TAG);
  const venues = await prisma.venue.findMany({
    select: { slug: true, name: true, wordmark: true },
    orderBy: { sortOrder: "asc" },
  });
  return venues;
}

/** A single venue by slug, or null if it does not exist. */
export async function getVenueBySlug(slug: string): Promise<VenueSummary | null> {
  "use cache";
  cacheTag(MENU_TAG, venueTag(slug));
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
  cacheTag(MENU_TAG, venueTag(venueSlug));
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: {
      menu: {
        select: {
          categories: {
            // Skip soft-deleted (trashed) categories in the public menu.
            where: { visible: true, category: { deletedAt: null } },
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
  productId: string; // the underlying Product id — used by admin inline edit/delete
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
  available: boolean; // per-venue visibility; public reads only ever return true
};

export type MenuCategoryView = {
  slug: string;
  name: string; // localized to the requested locale (tr fallback)
  columns: number | null; // grid column override for photo cards (null = default)
  visible: boolean; // per-venue visibility; public reads only ever return true
  items: MenuItemView[];
};

// Shared Prisma selects so the public (cached) and admin (fresh) menu reads map
// from identical row shapes — one mapper, no drift (centralized per code-quality).
const menuCategorySelect = {
  categoryId: true,
  visible: true,
  category: {
    select: {
      slug: true,
      columns: true,
      translations: { select: { locale: true, name: true } },
    },
  },
} satisfies Prisma.MenuCategorySelect;

const menuItemSelect = {
  id: true,
  price: true,
  categoryId: true,
  featured: true,
  available: true,
  prices: {
    orderBy: { sortOrder: "asc" },
    select: { label: true, amount: true },
  },
  product: {
    select: {
      id: true,
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
} satisfies Prisma.MenuItemSelect;

type MenuCategoryRow = Prisma.MenuCategoryGetPayload<{ select: typeof menuCategorySelect }>;
type MenuItemRow = Prisma.MenuItemGetPayload<{ select: typeof menuItemSelect }>;

/** Map raw menu rows → localized, serializable category views (shared by the
 *  public and admin reads). */
function mapMenu(
  categories: MenuCategoryRow[],
  items: MenuItemRow[],
  locale: string,
): MenuCategoryView[] {
  const itemsByCategory = new Map<string, MenuItemView[]>();
  for (const item of items) {
    const t = pickLocalized(item.product.translations, locale);
    const view: MenuItemView = {
      id: item.id,
      productId: item.product.id,
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
      available: item.available,
    };
    const bucket = itemsByCategory.get(item.categoryId) ?? [];
    bucket.push(view);
    itemsByCategory.set(item.categoryId, bucket);
  }

  return categories.map((mc) => ({
    slug: mc.category.slug,
    name: localized(mc.category.translations, (r) => r.name, locale) || mc.category.slug,
    columns: mc.category.columns,
    visible: mc.visible,
    items: itemsByCategory.get(mc.categoryId) ?? [],
  }));
}

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
  cacheTag(MENU_TAG, venueTag(venueSlug));
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: {
      menu: {
        select: {
          categories: {
            // Public menu: visible, non-trashed categories only.
            where: { visible: true, category: { deletedAt: null } },
            orderBy: { sortOrder: "asc" },
            select: menuCategorySelect,
          },
          items: {
            // Public menu: available items whose product isn't trashed.
            where: { available: true, product: { deletedAt: null } },
            orderBy: { sortOrder: "asc" },
            select: menuItemSelect,
          },
        },
      },
    },
  });

  if (!venue?.menu) return null;
  return mapMenu(venue.menu.categories, venue.menu.items, locale);
}

/**
 * Admin view of a venue's menu: visible categories (order preserved) but ALL
 * their items — including hidden (available:false) ones — so the owner can see
 * and re-enable what they've hidden. Fresh (uncached): admin edits must read
 * their own writes. Trashed (soft-deleted) categories/products stay excluded.
 */
export async function getVenueMenuAdmin(
  venueSlug: string,
  locale: string = DEFAULT_LOCALE,
): Promise<MenuCategoryView[] | null> {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: {
      menu: {
        select: {
          categories: {
            where: { visible: true, category: { deletedAt: null } },
            orderBy: { sortOrder: "asc" },
            select: menuCategorySelect,
          },
          items: {
            // No `available` filter — hidden items are shown (greyed) to the admin.
            where: { product: { deletedAt: null } },
            orderBy: { sortOrder: "asc" },
            select: menuItemSelect,
          },
        },
      },
    },
  });

  if (!venue?.menu) return null;
  return mapMenu(venue.menu.categories, venue.menu.items, locale);
}

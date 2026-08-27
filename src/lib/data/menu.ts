import "server-only";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCALE, pickLocalized } from "@/lib/i18n";

// Thin, typed data-access layer (ARCHITECTURE.md). Components/pages call these
// functions; they never touch `prisma.*` directly. Reads are venue-scoped by
// slug — venue identity is data, never a code branch (AGENTS.md 10).
//
// Reads use `"use cache"` so the mostly-static menu renders as a cached/static
// shell (Cache Components). When admin edits land later, revalidate by tag.
// Functions return plain, serializable DTOs (localized strings) — safe across
// the cache boundary and decoupled from Prisma types.

export type VenueSummary = { slug: string; name: string };
export type CategoryLink = { slug: string; name: string };

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
    select: { slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  return venues;
}

/** A single venue by slug, or null if it does not exist. */
export async function getVenueBySlug(slug: string): Promise<VenueSummary | null> {
  "use cache";
  return prisma.venue.findUnique({
    where: { slug },
    select: { slug: true, name: true },
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
    name: pickLocalized(mc.category.translations, locale)?.name ?? mc.category.slug,
  }));
}

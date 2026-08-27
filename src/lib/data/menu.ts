import "server-only";
import { prisma } from "@/lib/db";

// Thin, typed data-access layer (ARCHITECTURE.md). Components/pages call these
// functions; they never call `prisma.*` directly. Reads are venue-scoped by slug
// — venue identity is data, never a code branch (AGENTS.md 10).

export function getVenueBySlug(slug: string) {
  return prisma.venue.findUnique({ where: { slug } });
}

export function listVenues() {
  return prisma.venue.findMany({ orderBy: { sortOrder: "asc" } });
}

/**
 * Full menu for a venue: visible categories in order, each with its available
 * menu items (ordered), the shared Product, and translations. Returns null if
 * the venue or its menu does not exist.
 */
export async function getMenuForVenue(venueSlug: string) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    include: {
      menu: {
        include: {
          categories: {
            where: { visible: true },
            orderBy: { sortOrder: "asc" },
            include: {
              category: { include: { translations: true } },
            },
          },
          items: {
            where: { available: true },
            orderBy: { sortOrder: "asc" },
            include: {
              product: { include: { translations: true } },
            },
          },
        },
      },
    },
  });
  return venue?.menu ?? null;
}

import "server-only";
import { cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { deleteImage } from "@/lib/images";
import { MENU_TAG } from "@/lib/cache";

// Brand + venue assets managed from the admin Settings page (DECISIONS B.11).
// The brand mark read is cached (tagged MENU_TAG) so the public menu picks up a
// new logo on the next revalidate; writes go through the same data-access layer.

/** Uploaded brand mark URL, or null when unset (caller falls back to BRAND.mark). */
export async function getBrandLogo(): Promise<string | null> {
  "use cache";
  cacheTag(MENU_TAG);
  const business = await prisma.business.findFirst({ select: { logo: true } });
  return business?.logo ?? null;
}

/** Fresh snapshot for the admin Settings form: brand logo + each venue's wordmark. */
export async function getSettings(): Promise<{
  logo: string | null;
  venues: { slug: string; name: string; wordmark: string | null }[];
}> {
  const [business, venues] = await Promise.all([
    prisma.business.findFirst({ select: { logo: true } }),
    prisma.venue.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, wordmark: true },
    }),
  ]);
  return { logo: business?.logo ?? null, venues };
}

/** Set/replace/clear the brand mark; deletes the previous blob on change. */
export async function setBrandLogo(image: string | null) {
  const business = await prisma.business.findFirst({ select: { id: true, logo: true } });
  if (!business) throw new Error("Business not found");
  if (business.logo && business.logo !== image) await deleteImage(business.logo);
  await prisma.business.update({ where: { id: business.id }, data: { logo: image } });
}

/** Set/replace/clear a venue's wordmark; deletes the previous blob on change. */
export async function setVenueWordmark(venueSlug: string, image: string | null) {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { id: true, wordmark: true },
  });
  if (!venue) throw new Error("Venue not found");
  if (venue.wordmark && venue.wordmark !== image) await deleteImage(venue.wordmark);
  await prisma.venue.update({ where: { id: venue.id }, data: { wordmark: image } });
}

import type { MetadataRoute } from "next";
import { getVenueMenu, listVenueSlugs } from "@/lib/data/menu";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://menu.monohotelantalya.com";

// Sitemap of the public menu: root, each venue, and each visible category.
// Guarded so a DB-less build still produces a minimal sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [{ url: BASE }];
  try {
    for (const venueSlug of await listVenueSlugs()) {
      entries.push({ url: `${BASE}/${venueSlug}` });
      const menu = await getVenueMenu(venueSlug);
      for (const c of menu ?? []) {
        entries.push({ url: `${BASE}/${venueSlug}/${c.slug}` });
      }
    }
  } catch {
    // no DB at build — return the root only
  }
  return entries;
}

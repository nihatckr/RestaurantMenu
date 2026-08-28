import type { MetadataRoute } from "next";
import { getVenueMenu, listVenueSlugs } from "@/lib/data/menu";
import { LOCALES } from "@/lib/i18n";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://menu.monohotelantalya.com";

// Sitemap of the public menu: per locale, each venue and each visible category
// (URLs are locale-prefixed, `/[locale]/…`). Guarded so a DB-less build still
// produces a minimal sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = LOCALES.map((l) => ({ url: `${BASE}/${l}` }));
  try {
    for (const venueSlug of await listVenueSlugs()) {
      const menu = await getVenueMenu(venueSlug);
      for (const locale of LOCALES) {
        entries.push({ url: `${BASE}/${locale}/${venueSlug}` });
        for (const c of menu ?? []) {
          entries.push({ url: `${BASE}/${locale}/${venueSlug}/${c.slug}` });
        }
      }
    }
  } catch {
    // no DB at build — return the locale roots only
  }
  return entries;
}

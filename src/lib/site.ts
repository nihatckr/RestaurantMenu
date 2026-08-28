// App-level constants (not design tokens, not domain data).

/**
 * Canonical public origin. Override per environment with `NEXT_PUBLIC_SITE_URL`;
 * the fallback is the production domain. Used for `metadataBase`, `sitemap.ts`
 * and `robots.ts` so the URL lives in ONE place.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://menu.monohotelantalya.com";

/**
 * Placeholder params for a DB-less build (CI): `cacheComponents` needs ≥1 param to
 * prerender, but there is no database to enumerate real venues/categories. These
 * routes 404 at runtime if the slug doesn't exist — they only satisfy the build,
 * and are never used as logic (see each `generateStaticParams`).
 */
export const BUILD_FALLBACK = {
  venueSlug: "terrace",
  categorySlug: "starters",
} as const;

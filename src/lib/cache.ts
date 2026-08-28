import "server-only";
import { revalidateTag } from "next/cache";

// Cache tags for the public menu reads (applied via `cacheTag` in
// `src/lib/data/menu.ts`). Admin mutations call `revalidateMenu()` so the static /
// cached public pages refresh on the next request. One place defines the tag names
// so the reads and the invalidations can never drift.
export const MENU_TAG = "menu";
export const venueTag = (slug: string) => `venue:${slug}`;

/**
 * Invalidate the public menu cache after an admin write. Pass a venue slug to also
 * target that venue's tag; omit to refresh everything menu-related.
 *
 * Uses `revalidateTag` (serve-stale-then-refresh). When the admin wants the owner to
 * see their own edit immediately (read-your-own-writes), a Server Action can call
 * `updateTag` from `next/cache` instead — same tag names.
 */
export function revalidateMenu(venueSlug?: string) {
  // `"max"` = serve stale while revalidating in the background (recommended;
  // single-arg form is deprecated in Next 16).
  revalidateTag(MENU_TAG, "max");
  if (venueSlug) revalidateTag(venueTag(venueSlug), "max");
}

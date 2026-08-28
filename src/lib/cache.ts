import "server-only";
import { updateTag } from "next/cache";

// Cache tags for the public menu reads (applied via `cacheTag` in
// `src/lib/data/menu.ts`). Admin mutations call `revalidateMenu()` so the static /
// cached public pages refresh on the next request. One place defines the tag names
// so the reads and the invalidations can never drift.
export const MENU_TAG = "menu";
export const venueTag = (slug: string) => `venue:${slug}`;

/**
 * Invalidate the public menu cache after an admin write, **read-your-own-writes**:
 * `updateTag` purges immediately so the admin's next render (router.refresh) shows
 * the change right away — not stale-while-revalidate. Must be called from a Server
 * Action (updateTag's constraint), which all our admin mutations are.
 */
export function revalidateMenu(venueSlug?: string) {
  updateTag(MENU_TAG);
  if (venueSlug) updateTag(venueTag(venueSlug));
}

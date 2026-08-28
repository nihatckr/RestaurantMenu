import { isAdmin } from "@/lib/auth";
import { getCategoriesAdmin } from "@/lib/data/admin";
import { listVenueCategories } from "@/lib/data/menu";
import { isOpenAt, nowHHMMInIstanbul } from "@/lib/schedule";
import { CategoryNav } from "@/components/CategoryNav";
import { CategoryManager } from "./CategoryManager";

// One category list, session-aware: guests get the plain server-rendered nav
// (cached data, no admin JS); a logged-in admin gets the SAME list with inline
// edit/delete + "add" controls. Rendered inside a Suspense boundary on the landing
// (it reads the session), so the rest of the page stays in the static shell.
export async function CategoryNavIsland({
  locale,
  venueSlug,
}: {
  locale: string;
  venueSlug: string;
}) {
  if (await isAdmin()) {
    const rows = await getCategoriesAdmin(venueSlug);
    return <CategoryManager locale={locale} venueSlug={venueSlug} categories={rows} />;
  }
  // Guest branch is request-time (the `isAdmin()` above reads cookies), so reading
  // the current wall-clock is safe here. Scheduled categories (e.g. Breakfast
  // 06:00–11:00) drop out of the navigation outside their window.
  const categories = await listVenueCategories(venueSlug, locale);
  const now = nowHHMMInIstanbul();
  const open = categories.filter((c) => isOpenAt(c.visibleFrom, c.visibleTo, now));
  return <CategoryNav locale={locale} venueSlug={venueSlug} categories={open} />;
}

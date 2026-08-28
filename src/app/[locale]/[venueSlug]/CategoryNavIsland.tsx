import { isAdmin } from "@/lib/auth";
import { getCategoriesAdmin } from "@/lib/data/admin";
import { listVenueCategories } from "@/lib/data/menu";
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
  const categories = await listVenueCategories(venueSlug, locale);
  return <CategoryNav locale={locale} venueSlug={venueSlug} categories={categories} />;
}

import { isAdmin } from "@/lib/auth";
import { getCategoriesAdmin } from "@/lib/data/admin";
import { CategoryManager } from "./CategoryManager";

// Session-gated island: renders the inline category manager only for a logged-in
// admin (guests get null, so the static public shell is unaffected — it lives in a
// Suspense boundary on the landing).
export async function CategoryAdmin({
  locale,
  venueSlug,
}: {
  locale: string;
  venueSlug: string;
}) {
  if (!(await isAdmin())) return null;
  const categories = await getCategoriesAdmin(venueSlug);
  return <CategoryManager locale={locale} venueSlug={venueSlug} categories={categories} />;
}

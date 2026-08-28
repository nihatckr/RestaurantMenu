import { isAdmin } from "@/lib/auth";
import { CategorySection } from "@/components/CategorySection";
import { getProductsAdmin, getCategoryOptions } from "@/lib/data/admin";
import type { MenuCategoryView } from "@/lib/data/menu";

// Plain guest sections — used both as the static prerendered shell (the Suspense
// fallback) and as what the island returns for guests, so the two are identical
// and swap seamlessly.
export function GuestSections({ ordered }: { ordered: MenuCategoryView[] }) {
  return (
    <>
      {ordered.map((category) => (
        <CategorySection key={category.slug} category={category} />
      ))}
    </>
  );
}

// Session-gated island: guests get the static sections (no cookies read at the
// shell level — the fallback prerenders them); an admin gets the same sections
// with inline per-product edit/delete + an "add product" control per category.
export async function MenuSectionsIsland({
  locale,
  venueSlug,
  ordered,
}: {
  locale: string;
  venueSlug: string;
  ordered: MenuCategoryView[];
}) {
  if (!(await isAdmin())) return <GuestSections ordered={ordered} />;

  const [products, categoryOptions] = await Promise.all([
    getProductsAdmin(venueSlug),
    getCategoryOptions(venueSlug),
  ]);
  const rowsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <>
      {ordered.map((category) => (
        <CategorySection
          key={category.slug}
          category={category}
          admin={{
            locale,
            venueSlug,
            categorySlug: category.slug,
            rowsById,
            categoryOptions,
          }}
        />
      ))}
    </>
  );
}

import { isAdmin } from "@/lib/auth";
import { CategorySection } from "@/components/CategorySection";
import { getProductsAdmin, getCategoryOptions } from "@/lib/data/admin";
import { getVenueMenuAdmin, type MenuCategoryView } from "@/lib/data/menu";

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
  categorySlug,
  ordered,
}: {
  locale: string;
  venueSlug: string;
  categorySlug: string;
  ordered: MenuCategoryView[];
}) {
  if (!(await isAdmin())) return <GuestSections ordered={ordered} />;

  // Admin menu includes hidden (available:false) items so the owner can see and
  // re-enable them; keep the same "chosen category first" order as the public page.
  const [adminMenu, products, categoryOptions] = await Promise.all([
    getVenueMenuAdmin(venueSlug, locale),
    getProductsAdmin(venueSlug),
    getCategoryOptions(venueSlug),
  ]);
  const menu = adminMenu ?? ordered;
  const chosen = menu.find((c) => c.slug === categorySlug);
  const adminOrdered = chosen
    ? [chosen, ...menu.filter((c) => c.slug !== categorySlug)]
    : menu;
  const rowsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <>
      {adminOrdered.map((category) => (
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

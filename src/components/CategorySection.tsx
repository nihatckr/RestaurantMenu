import { MenuItemCard } from "@/components/MenuItemCard";
import type { MenuCategoryView, MenuItemView } from "@/lib/data/menu";

// A responsive grid of items: imageless measure/price drinks single-column,
// food/cocktails in a photo grid. Featured items span the full width.
function ItemGrid({ items }: { items: MenuItemView[] }) {
  const allCompact =
    items.length > 0 && items.every((i) => i.kind === "DRINK" && !i.image);
  return (
    <div
      className={
        allCompact
          ? "grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2"
          : "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4"
      }
    >
      {items.map((item) => (
        <div key={item.id} className={item.featured ? "col-span-full" : ""}>
          <MenuItemCard item={item} />
        </div>
      ))}
    </div>
  );
}

// A category heading + its items. When the category has several `tag`
// sub-categories (legacy hard drinks: Viski/Rakı/…), items are grouped under
// tag sub-headers; otherwise they render as a single grid (DESIGN.md).
export function CategorySection({ category }: { category: MenuCategoryView }) {
  const items = category.items;
  const tags = [
    ...new Set(items.map((i) => i.tag).filter((t): t is string => !!t)),
  ];
  const grouped = tags.length >= 2;

  return (
    <section className="w-full scroll-mt-4">
      <div className="py-4 text-center">
        <h2 className="font-brand text-base uppercase tracking-[0.2em] sm:text-lg">
          {category.name}
        </h2>
        {category.nameAlt && (
          <p className="font-body text-xs uppercase tracking-[0.2em] text-muted">
            {category.nameAlt}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center font-body text-xs text-muted">—</p>
      ) : grouped ? (
        <div className="flex flex-col gap-6">
          {tags.map((tag) => (
            <div key={tag}>
              <h3 className="mb-2 font-brand text-sm uppercase tracking-[0.15em] text-muted">
                {tag}
              </h3>
              <ItemGrid items={items.filter((i) => i.tag === tag)} />
            </div>
          ))}
        </div>
      ) : (
        <ItemGrid items={items} />
      )}
    </section>
  );
}

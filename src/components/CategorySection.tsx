import { MenuItemCard } from "@/components/MenuItemCard";
import type { MenuCategoryView } from "@/lib/data/menu";

// A category heading + its items. Drink-only categories render as a single
// column (compact rows); food/mixed render as a grid (DESIGN.md).
export function CategorySection({ category }: { category: MenuCategoryView }) {
  // Compact single-column only for imageless measure/price drinks (beers, wines,
  // spirits, soft). Categories with photos — food and cocktails — use the grid.
  const allDrinks =
    category.items.length > 0 &&
    category.items.every((i) => i.kind === "DRINK" && !i.image);

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
      {category.items.length === 0 ? (
        <p className="text-center font-body text-xs text-muted">—</p>
      ) : (
        <div
          className={
            allDrinks
              ? "grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2"
              : "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4"
          }
        >
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

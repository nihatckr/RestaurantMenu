import { MenuItemCard } from "@/components/MenuItemCard";
import type { MenuCategoryView } from "@/lib/data/menu";

// A category heading + its items. Drink-only categories render as a single
// column (compact rows); food/mixed render as a grid (DESIGN.md).
export function CategorySection({ category }: { category: MenuCategoryView }) {
  const allDrinks =
    category.items.length > 0 &&
    category.items.every((i) => i.kind === "DRINK");

  return (
    <section className="w-full max-w-md">
      <h2 className="py-4 text-center font-brand text-base uppercase tracking-[0.2em]">
        {category.name}
      </h2>
      {category.items.length === 0 ? (
        <p className="text-center font-body text-xs text-muted">—</p>
      ) : (
        <div className={allDrinks ? "flex flex-col" : "grid grid-cols-2 gap-x-4 gap-y-6"}>
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

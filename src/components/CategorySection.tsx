import { MenuItemCard } from "@/components/MenuItemCard";
import { formatPriceTRY } from "@/lib/format";
import type { MenuCategoryView, MenuItemView } from "@/lib/data/menu";

// A responsive grid of items: imageless single-price/single-measure drinks
// (beers, softs) as compact cards, food/cocktails in a photo grid. Column
// counts follow the Figma menu (3-up food, 3-up compact drinks). Featured
// items span the full width.
function ItemGrid({
  items,
  columns,
}: {
  items: MenuItemView[];
  columns?: number | null;
}) {
  const nonEmpty = items.length > 0;
  // Compact imageless drinks (beers/softs/wines) → legacy 3-up.
  const allCompact = nonEmpty && items.every((i) => i.kind === "DRINK" && !i.image);
  // Cocktails (DRINK + photo) → Figma 5-up tall-portrait tiles.
  const allCocktail = nonEmpty && items.every((i) => i.kind === "DRINK" && !!i.image);
  // Food photo grid: category `columns` override (desserts/breakfast = 2), else 3.
  const foodCols = columns === 2 ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-4";
  const cls = allCompact
    ? "grid grid-cols-3 gap-x-6 gap-y-2"
    : allCocktail
      ? "grid grid-cols-5 gap-x-1.5 gap-y-3 sm:gap-x-3"
      : `grid gap-x-3 gap-y-6 sm:gap-x-6 ${foodCols}`;
  return (
    <div className={cls}>
      {items.map((item) => (
        <div key={item.id} className={item.featured ? "col-span-full" : ""}>
          <MenuItemCard item={item} />
        </div>
      ))}
    </div>
  );
}

// A measure label is a "bottle" size (≥30 CL, or "Şişe") vs a "glass" pour
// (4/5/8 CL, or "Kadeh"). Legacy MenuItemHardDrinks split prices into exactly
// these two groups (titleCl "4 CL / 8 CL" + subtitleCl "35 CL / 50 CL / 70 CL").
function isBottleMeasure(label: string): boolean {
  const cl = label.match(/(\d+)\s*CL/i);
  if (cl) return Number(cl[1]) >= 30;
  return /şişe|bottle/i.test(label);
}

// Hard-drinks price table (legacy MenuItemHardDrinks + Figma): product name on
// the left, then a GLASS column (small pours, slash-joined) and a BOTTLE column
// (bottle sizes, slash-joined). Each group's header is its CL labels joined
// (e.g. "4 CL / 8 CL", "35 CL / 50 CL / 70 CL"). Groups are data-driven — the
// BOTTLE column only appears once bottle-size prices exist in the data. Figma
// uses Inter Bold for name + price (also avoids the Mono slashed-zero).
function DrinkTable({ items }: { items: MenuItemView[] }) {
  const glassLabels: string[] = [];
  const bottleLabels: string[] = [];
  for (const item of items)
    for (const p of item.prices) {
      const bucket = isBottleMeasure(p.label) ? bottleLabels : glassLabels;
      if (!bucket.includes(p.label)) bucket.push(p.label);
    }
  const hasBottle = bottleLabels.length > 0;

  // Join a product's prices for the measures in a group, slash-separated.
  const groupPrices = (item: MenuItemView, group: string[]) =>
    group
      .map((l) => item.prices.find((p) => p.label === l))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => formatPriceTRY(p.amount))
      .join(" / ");

  return (
    <div className="w-full">
      {/* Header: the CL labels for each group (no product label — Figma hides it). */}
      <div className="flex items-baseline gap-4 border-b border-muted/20 pb-1 font-body text-[10px] uppercase tracking-wider text-muted">
        <span className="flex-1" aria-hidden />
        <span className="w-20 text-right sm:w-28">{glassLabels.join(" / ")}</span>
        {hasBottle && (
          <span className="w-28 text-right sm:w-40">{bottleLabels.join(" / ")}</span>
        )}
      </div>

      <div className="flex flex-col divide-y divide-muted/10">
        {items.map((item) => (
          <div key={item.id} className="flex items-baseline gap-4 py-1.5">
            <div className="min-w-0 flex-1">
              <span className="font-body text-sm font-bold">{item.title}</span>
              {item.dlc && (
                <span className="ml-1.5 rounded border border-muted/40 px-1 align-middle text-[9px] text-muted">
                  DLC
                </span>
              )}
              {item.titleAlt && (
                <span className="ml-2 font-body text-xs text-muted">
                  {item.titleAlt}
                </span>
              )}
            </div>
            <span className="w-20 text-right font-body text-sm font-bold tabular-nums sm:w-28">
              {groupPrices(item, glassLabels)}
            </span>
            {hasBottle && (
              <span className="w-28 text-right font-body text-sm font-bold tabular-nums sm:w-40">
                {groupPrices(item, bottleLabels)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// A tag sub-group of hard drinks (Champaign/Gin/Vodka): imageless drinks with
// measures render as an aligned price table (Figma). Wines are NOT tag-grouped,
// so they never reach this path — they stay as cards (ItemGrid) below.
function TagGroup({ items }: { items: MenuItemView[] }) {
  const allCompact =
    items.length > 0 && items.every((i) => i.kind === "DRINK" && !i.image);
  const maxMeasures = items.reduce((m, i) => Math.max(m, i.prices.length), 0);
  if (allCompact && maxMeasures >= 2) return <DrinkTable items={items} />;
  return <ItemGrid items={items} />;
}

// A category heading + its items. When the category has several `tag`
// sub-categories (legacy hard drinks: Viski/Rakı/…), items are grouped under
// tag sub-headers; otherwise they render as a single group (DESIGN.md).
export function CategorySection({ category }: { category: MenuCategoryView }) {
  const items = category.items;
  const tags = [
    ...new Set(items.map((i) => i.tag).filter((t): t is string => !!t)),
  ];
  const grouped = tags.length >= 2;

  // Figma category header leads with English (STARTERS big, BAŞLANGIÇLAR small)
  // — the opposite emphasis of the TR-primary category LIST. nameAlt is the
  // secondary-language name (EN under the tr default); fall back to name if absent.
  const heading = category.nameAlt ?? category.name;
  const subheading = category.nameAlt ? category.name : null;

  return (
    <section className="w-full scroll-mt-4">
      <div className="py-4 text-center">
        <h2 className="font-brand text-base uppercase tracking-[0.2em] sm:text-lg">
          {heading}
        </h2>
        {subheading && (
          <p className="font-body text-xs uppercase tracking-[0.2em] text-muted">
            {subheading}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center font-body text-xs text-muted">—</p>
      ) : grouped ? (
        <div className="flex flex-col gap-6">
          {tags.map((tag) => {
            // Sub-category header EN-big + TR-small (legacy HeaderSubCenter,
            // left-aligned). tagAlt is the EN name; fall back to TR-only.
            const alt = items.find((i) => i.tag === tag)?.tagAlt ?? null;
            const heading = alt ?? tag;
            const subheading = alt ? tag : null;
            return (
              <div key={tag}>
                <h3 className="font-brand text-base tracking-[0.1em] text-foreground">
                  {heading}
                </h3>
                {subheading && (
                  <p className="mb-1 font-body text-[10px] uppercase tracking-[0.2em] text-muted">
                    {subheading}
                  </p>
                )}
                <TagGroup items={items.filter((i) => i.tag === tag)} />
              </div>
            );
          })}
        </div>
      ) : (
        <ItemGrid items={items} columns={category.columns} />
      )}
    </section>
  );
}

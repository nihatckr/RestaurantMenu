import { Fragment } from "react";
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
  // Grids are mobile-first responsive (1/2/3 up) so nothing is cramped on a phone.
  // Compact imageless drinks (beers/softs/wines): 2 → 3 (with smaller text on
  // phones — 1-up was too sparse, user request).
  const allCompact = nonEmpty && items.every((i) => i.kind === "DRINK" && !i.image);
  // Cocktails (DRINK + photo): 3 → 4 → 5 (Figma 5-up on desktop, readable on phone).
  const allCocktail = nonEmpty && items.every((i) => i.kind === "DRINK" && !!i.image);
  // Food photo grid: category `columns` override (desserts/breakfast = 2 up),
  // else responsive 2 → 3 → 4 so phone photos aren't tiny.
  const foodCols =
    columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  const cls = allCompact
    ? "grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3"
    : allCocktail
      ? "grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-x-3 lg:grid-cols-5"
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

  const priceOf = (item: MenuItemView, label: string) => {
    const p = item.prices.find((x) => x.label === label);
    return p ? formatPriceTRY(p.amount) : "";
  };

  // One grid column per measure (auto-sized), shared by the header and every row
  // so each CL label sits exactly above its price. A narrow gap column separates
  // the GLASS group from the BOTTLE group. The name takes the remaining space.
  const gridTemplateColumns = [
    "minmax(0,1fr)",
    ...glassLabels.map(() => "auto"),
    ...(hasBottle ? ["0.75rem", ...bottleLabels.map(() => "auto")] : []),
  ].join(" ");

  const label = "type-label whitespace-nowrap pb-1 text-right";
  const priceCell = "type-price py-1 text-right text-sm";
  const gap = <span aria-hidden />;

  // ONE grid holds the header AND every row's cells (via Fragments), so the auto
  // columns size to the widest content across ALL rows and stay aligned — a
  // missing measure just leaves an empty cell that holds its column.
  return (
    <div
      className="grid w-full items-baseline gap-x-2 sm:gap-x-3"
      style={{ gridTemplateColumns }}
    >
      {/* header */}
      <span aria-hidden className="pb-1" />
      {glassLabels.map((l) => (
        <span key={`h-${l}`} className={label}>
          {l}
        </span>
      ))}
      {hasBottle && <span aria-hidden className="pb-1" />}
      {hasBottle &&
        bottleLabels.map((l) => (
          <span key={`hb-${l}`} className={label}>
            {l}
          </span>
        ))}

      {/* one Fragment per product → its cells flow into the shared grid columns */}
      {items.map((item) => (
        <Fragment key={item.id}>
          <div className="min-w-0 py-1 leading-tight">
            <span className="type-item text-sm">
              {item.title}
              {item.dlc && (
                <span className="ml-1.5 rounded border border-muted/40 px-1 align-middle text-[0.5625rem] text-muted">
                  DLC
                </span>
              )}
            </span>
          </div>
          {glassLabels.map((l) => (
            <span key={`g-${item.id}-${l}`} className={priceCell}>
              {priceOf(item, l)}
            </span>
          ))}
          {hasBottle && gap}
          {hasBottle &&
            bottleLabels.map((l) => (
              <span key={`b-${item.id}-${l}`} className={priceCell}>
                {priceOf(item, l)}
              </span>
            ))}
        </Fragment>
      ))}
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

  // Single-language category header (the locale comes from the route). The page
  // sets `lang` on <html>, so the uppercase title gets the right dotted/dotless I
  // (SPIRITS in en, VİSKİ in tr) from the CSS text-transform automatically.
  return (
    <section className="reveal w-full scroll-mt-4">
      <div className="py-4 text-center">
        <h2 className="type-heading text-lg tracking-[0.125em]">{category.name}</h2>
      </div>

      {items.length === 0 ? (
        <p className="type-desc text-center text-xs">—</p>
      ) : grouped ? (
        <div className="flex flex-col gap-6">
          {tags.map((tag) => {
            // Sub-category header, localized to the page locale (legacy
            // HeaderSubCenter, left-aligned). tagLabel falls back to the TR tag.
            const heading = items.find((i) => i.tag === tag)?.tagLabel ?? tag;
            return (
              <div key={tag}>
                <h3 className="type-tag text-base tracking-[0.125em]">{heading}</h3>
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

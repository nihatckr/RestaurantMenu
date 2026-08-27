import { formatPriceTRY } from "@/lib/format";
import { ImageWithPlaceholder } from "@/components/ImageWithPlaceholder";
import type { MenuItemView } from "@/lib/data/menu";

// Card variants, all data-driven (never a category-name string):
//  • FOOD or any item with a photo → image card (square for food, tall portrait
//    for cocktails = DRINK+image), Figma menu-card layout.
//  • imageless drinks (beers, softs, wines) → compact card: name on its own
//    line, then the measure label (e.g. "50 CL") over the price (Figma beer).
export function MenuItemCard({ item }: { item: MenuItemView }) {
  const price = formatPriceTRY(item.price);
  const isImageCard = item.kind === "FOOD" || !!item.image;

  if (isImageCard) {
    const portrait = item.kind === "DRINK"; // cocktails: tall narrow tile
    return (
      <article className="flex flex-col">
        <ImageWithPlaceholder src={item.image} alt={item.title} portrait={portrait} />
        <div className="flex items-baseline justify-between gap-2 pt-1">
          <h3
            className={`min-w-0 font-body font-bold ${portrait ? "text-xs" : "text-sm"}`}
          >
            {item.title}
          </h3>
          {price && (
            <span
              className={`whitespace-nowrap font-brand ${portrait ? "text-xs" : "text-sm"}`}
            >
              {price}
            </span>
          )}
        </div>
        {item.titleAlt && (
          <p className="font-body text-xs text-muted">{item.titleAlt}</p>
        )}
        {item.subtitle && (
          <p className="font-body text-xs text-muted">{item.subtitle}</p>
        )}
        {item.description && (
          <p className="font-body text-xs text-muted">{item.description}</p>
        )}
      </article>
    );
  }

  // Compact imageless drink card (Figma beer): tinted box, name on top (wraps —
  // never truncated), then the measure label over its price. Multi-measure
  // wines show each measure column side by side.
  return (
    <div className="relative overflow-hidden rounded">
      {item.color && (
        <span
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: item.color }}
        />
      )}
      <div className="relative flex flex-col gap-1 p-2">
        <p className="font-body text-sm font-bold leading-tight">
          {item.title}
          {item.dlc && (
            <span className="ml-1.5 rounded border border-muted/40 px-1 align-middle text-[9px] text-muted">
              DLC
            </span>
          )}
        </p>
        {item.titleAlt && (
          <p className="font-body text-xs leading-tight text-muted">{item.titleAlt}</p>
        )}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1 pt-0.5">
          {item.prices.length > 0 ? (
            item.prices.map((po) => (
              <div
                key={po.label}
                className="flex flex-col border-l border-foreground/25 pl-2 leading-tight"
              >
                <span className="type-label">{po.label}</span>
                <span className="font-brand text-sm">{formatPriceTRY(po.amount)}</span>
              </div>
            ))
          ) : price ? (
            // Softs have no measure label but keep the same bordered-price
            // discipline as the beer cards (user request).
            <div className="flex flex-col border-l border-foreground/25 pl-2 leading-tight">
              <span className="font-brand text-sm">{price}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

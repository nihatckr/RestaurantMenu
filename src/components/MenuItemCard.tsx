import { formatPriceTRY } from "@/lib/format";
import { ImageWithPlaceholder } from "@/components/ImageWithPlaceholder";
import type { MenuItemView } from "@/lib/data/menu";

// One card, two layouts (DESIGN.md): imageless measure/price drinks (beers,
// wines, spirits, soft) render as a compact title/price row; everything with a
// photo — food AND cocktails — renders as an image card. The variant is driven
// by the data (image + measures), never a category name string.
export function MenuItemCard({ item }: { item: MenuItemView }) {
  const price = formatPriceTRY(item.price);

  if (item.kind === "DRINK" && !item.image) {
    return (
      <div className="relative overflow-hidden rounded">
        {/* translucent colour chip behind the row (legacy MenuCardSoft/Wines) */}
        {item.color && (
          <span
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{ backgroundColor: item.color }}
          />
        )}
        <div className="relative flex items-baseline justify-between gap-3 px-2 py-2.5">
          <div className="min-w-0">
            <p className="truncate font-brand text-sm">{item.title}</p>
            {item.titleAlt && (
              <p className="truncate font-body text-xs text-muted">{item.titleAlt}</p>
            )}
            {item.tag && (
              <p className="font-body text-xs text-muted">{item.tag}</p>
            )}
          </div>
          {item.prices.length > 0 ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-x-3 gap-y-0.5">
              {item.prices.map((po) => (
                <span key={po.label} className="whitespace-nowrap font-brand text-sm">
                  <span className="text-xs text-muted">{po.label}</span>{" "}
                  {formatPriceTRY(po.amount)}
                </span>
              ))}
            </div>
          ) : (
            price && <p className="whitespace-nowrap font-brand text-sm">{price}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-1.5">
      <ImageWithPlaceholder src={item.image} alt={item.title} />
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-brand text-sm">{item.title}</h3>
          {item.titleAlt && (
            <p className="font-body text-xs text-muted">{item.titleAlt}</p>
          )}
        </div>
        {price && (
          <span className="whitespace-nowrap font-brand text-sm">{price}</span>
        )}
      </div>
      {item.subtitle && (
        <p className="font-body text-xs text-muted">{item.subtitle}</p>
      )}
      {item.description && (
        <p className="font-body text-xs text-muted">{item.description}</p>
      )}
    </article>
  );
}

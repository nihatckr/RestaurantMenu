import { formatPriceTRY } from "@/lib/format";
import { ImageWithPlaceholder } from "@/components/ImageWithPlaceholder";
import type { MenuItemView } from "@/lib/data/menu";

// One card that adapts by item kind (DESIGN.md): drinks are a compact
// title/price row; food shows an image (or placeholder), title, price, and
// bilingual copy. Card variant comes from structured data (`kind`), never from a
// category name string.
export function MenuItemCard({ item }: { item: MenuItemView }) {
  const price = formatPriceTRY(item.price);

  if (item.kind === "DRINK") {
    return (
      <div className="flex items-baseline justify-between gap-3 border-b border-muted/10 py-2">
        <div className="min-w-0">
          <p className="truncate font-brand text-sm">{item.title}</p>
          {item.tag && (
            <p className="font-body text-xs text-muted">{item.tag}</p>
          )}
        </div>
        {price && <p className="whitespace-nowrap font-brand text-sm">{price}</p>}
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-1.5">
      <ImageWithPlaceholder src={item.image} alt={item.title} />
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-brand text-sm">{item.title}</h3>
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

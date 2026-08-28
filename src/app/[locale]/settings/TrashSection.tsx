import { RotateCcw, Trash2 } from "lucide-react";
import { getTrash, type TrashItem } from "@/lib/data/admin";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyTrashButton } from "./EmptyTrashButton";
import { restoreCategoryAction } from "@/app/[locale]/[venueSlug]/category-actions";
import { restoreProductAction } from "@/app/[locale]/[venueSlug]/product-actions";

function TrashList({
  title,
  items,
  action,
}: {
  title: string;
  items: TrashItem[];
  action: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-body text-sm text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="font-body text-xs text-muted">—</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-2 py-1">
              <span className="font-body text-sm">
                {it.name}
                <span className="ml-2 text-xs text-muted">
                  {new Date(it.deletedAt).toLocaleDateString("tr-TR")}
                </span>
              </span>
              {/* Restore is business-wide → bound by id only. */}
              <form action={action.bind(null, it.id)}>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded border border-muted/40 px-2 py-1 font-body text-xs text-foreground transition-colors hover:border-foreground"
                >
                  <RotateCcw size={12} aria-hidden /> Geri al
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Trash bin: soft-deleted categories/products, restorable. Server-rendered — each
// restore is a plain form action (no client state).
export async function TrashSection() {
  const { categories, products } = await getTrash();
  const empty = categories.length === 0 && products.length === 0;
  return (
    <Card id="cop" className="flex flex-col gap-4">
      <CardHeader
        icon={Trash2}
        title="Çöp kutusu"
        description="Silinen kategori ve ürünler burada saklanır; geri alınabilir."
      />
      {empty ? (
        <p className="font-body text-sm text-muted">Çöp kutusu boş.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <TrashList title="Kategoriler" items={categories} action={restoreCategoryAction} />
          <TrashList title="Ürünler" items={products} action={restoreProductAction} />
          <div className="border-t border-muted/15 pt-3">
            <EmptyTrashButton />
          </div>
        </div>
      )}
    </Card>
  );
}

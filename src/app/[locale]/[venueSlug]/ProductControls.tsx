"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select } from "@/components/ui/form";
import { ImageField } from "@/components/ui/ImageField";
import type { ProductAdminRow } from "@/lib/data/admin";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductAvailabilityAction,
  moveProductAction,
  type ProductFormState,
} from "./product-actions";

export type CategoryOption = { slug: string; nameTr: string };

// Values the product form needs pre-filled (edit → existing row; add → just the
// section's category). A partial ProductAdminRow keeps both callers simple.
type Initial = Partial<ProductAdminRow> & { categorySlug: string };

// "Ürün ekle" button for a category section (admin-only). Opens the form modal
// with this section's category preselected.
export function AddProductButton({
  locale,
  venueSlug,
  categorySlug,
  categoryOptions,
  tagOptions,
  iconOnly = false,
}: {
  locale: string;
  venueSlug: string;
  categorySlug: string;
  categoryOptions: CategoryOption[];
  tagOptions: string[];
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const done = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      <Button
        variant="ghost"
        aria-label={iconOnly ? "Ürün ekle" : undefined}
        className={
          iconOnly
            ? "flex items-center justify-center p-1 text-xs"
            : "mx-auto mt-3 flex items-center justify-center gap-1 py-1.5 text-xs"
        }
        onClick={() => setOpen(true)}
      >
        <Plus size={iconOnly ? 16 : 14} aria-hidden />
        {!iconOnly && " Ürün ekle"}
      </Button>
      {open && (
        <ProductFormModal
          title="Ürün ekle"
          action={createProductAction.bind(null, locale, venueSlug)}
          initial={{ categorySlug }}
          categoryOptions={categoryOptions}
          tagOptions={tagOptions}
          onClose={() => setOpen(false)}
          onDone={done}
        />
      )}
    </>
  );
}

// Inline edit/delete for a single product. `overlay` positions the controls in
// the corner of a photo card; otherwise they sit inline (e.g. a drink-table row).
export function ProductRowControls({
  locale,
  venueSlug,
  row,
  available,
  categoryOptions,
  tagOptions,
  overlay = false,
  reorder,
}: {
  locale: string;
  venueSlug: string;
  row: ProductAdminRow;
  available: boolean;
  categoryOptions: CategoryOption[];
  tagOptions: string[];
  overlay?: boolean;
  // Present → show up/down arrows; each flag enables that direction (edge = off).
  reorder?: { up: boolean; down: boolean };
}) {
  const [editing, setEditing] = useState<"edit" | "delete" | null>(null);
  const router = useRouter();
  const done = useCallback(() => {
    setEditing(null);
    router.refresh();
  }, [router]);

  return (
    <>
      <span
        className={
          overlay
            ? "absolute right-1 top-1 z-10 flex gap-1 rounded bg-background/80 p-1 backdrop-blur"
            : "ml-2 inline-flex gap-1 align-middle"
        }
      >
        {reorder && (
          <>
            <form
              action={moveProductAction.bind(null, locale, venueSlug, row.id, "up")}
              className="flex"
            >
              <button
                type="submit"
                disabled={!reorder.up}
                aria-label={`${row.titleTr} yukarı taşı`}
                className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp size={14} aria-hidden />
              </button>
            </form>
            <form
              action={moveProductAction.bind(null, locale, venueSlug, row.id, "down")}
              className="flex"
            >
              <button
                type="submit"
                disabled={!reorder.down}
                aria-label={`${row.titleTr} aşağı taşı`}
                className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown size={14} aria-hidden />
              </button>
            </form>
          </>
        )}
        <button
          type="button"
          aria-label={`${row.titleTr} düzenle`}
          onClick={() => setEditing("edit")}
          className="text-muted transition-colors hover:text-foreground"
        >
          <Pencil size={14} aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`${row.titleTr} sil`}
          onClick={() => setEditing("delete")}
          className="text-muted transition-colors hover:text-mono-red"
        >
          <Trash2 size={14} aria-hidden />
        </button>
        {/* Show/hide toggle — a tiny form so it works without JS too. */}
        <form
          action={toggleProductAvailabilityAction.bind(
            null,
            locale,
            venueSlug,
            row.id,
            !available,
          )}
          className="flex"
        >
          <button
            type="submit"
            aria-label={available ? `${row.titleTr} gizle` : `${row.titleTr} göster`}
            className="text-muted transition-colors hover:text-foreground"
          >
            {available ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
          </button>
        </form>
      </span>

      {editing === "edit" && (
        <ProductFormModal
          title="Ürünü düzenle"
          action={updateProductAction.bind(null, locale, venueSlug, row.id)}
          initial={row}
          categoryOptions={categoryOptions}
          tagOptions={tagOptions}
          onClose={() => setEditing(null)}
          onDone={done}
        />
      )}
      {editing === "delete" && (
        <DeleteModal
          name={row.titleTr}
          action={deleteProductAction.bind(null, locale, venueSlug, row.id)}
          onClose={() => setEditing(null)}
          onDone={done}
        />
      )}
    </>
  );
}

function ProductFormModal({
  title,
  action,
  initial,
  categoryOptions,
  tagOptions,
  onClose,
  onDone,
}: {
  title: string;
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initial: Initial;
  categoryOptions: CategoryOption[];
  tagOptions: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  // Dynamic labelled measures (Kadeh/Şişe). Controlled so add/remove is reliable;
  // each row posts as parallel priceLabel/priceAmount fields. Keys are max+1 so
  // they stay unique across removals (no ref mutation during render).
  const [measures, setMeasures] = useState(() =>
    (initial.prices ?? []).map((p, i) => ({
      id: i,
      label: p.label,
      amount: String(p.amount),
    })),
  );
  const addMeasure = () =>
    setMeasures((m) => [
      ...m,
      { id: (m.length ? Math.max(...m.map((x) => x.id)) : -1) + 1, label: "", amount: "" },
    ]);
  const removeMeasure = (id: number) =>
    setMeasures((m) => m.filter((x) => x.id !== id));
  const setMeasure = (id: number, field: "label" | "amount", value: string) =>
    setMeasures((m) => m.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  return (
    <Modal open onClose={onClose} title={title}>
      <form action={formAction} className="flex flex-col gap-3">
        <p className="font-body text-xs text-muted">
          Ürün, menüdeki tek bir kalemdir (yemek ya da içecek). Adı üç dilde
          girilebilir; İngilizce/Rusça boşsa Türkçesi gösterilir.
        </p>
        <Field
          label="Ad (Türkçe)"
          hint="Menüde görünen ürün adı."
          error={state.fieldErrors?.titleTr}
        >
          <Input name="titleTr" defaultValue={initial.titleTr} required autoFocus />
        </Field>
        <Field
          label="Ad (İngilizce)"
          hint="Boş bırakılırsa Türkçesi gösterilir."
          error={state.fieldErrors?.titleEn}
        >
          <Input name="titleEn" defaultValue={initial.titleEn} />
        </Field>
        <Field
          label="Ad (Rusça)"
          hint="Boş bırakılırsa Türkçesi gösterilir."
          error={state.fieldErrors?.titleRu}
        >
          <Input name="titleRu" defaultValue={initial.titleRu} />
        </Field>
        <Field
          label="Kategori"
          hint="Ürünün hangi bölümde görüneceği. Değiştirirsen ürün o kategoriye taşınır."
          error={state.fieldErrors?.categorySlug}
        >
          <Select name="categorySlug" defaultValue={initial.categorySlug} required>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nameTr}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Tür"
          hint="Görünümü belirler — Yemek: kare fotoğraf; İçecek: dar fotoğraf ya da kompakt kart."
          error={state.fieldErrors?.kind}
        >
          <Select name="kind" defaultValue={initial.kind ?? "FOOD"}>
            <option value="FOOD">Yemek</option>
            <option value="DRINK">İçecek</option>
          </Select>
        </Field>
        <ImageField
          name="image"
          initial={initial.image}
          label="Ürün görseli"
          hint="Opsiyonel. Yüklenen görsel otomatik küçültülür ve WebP’e dönüştürülür."
        />
        <Field
          label="Tek fiyat (opsiyonel)"
          hint="Aşağıya ölçülü fiyat eklersen bu yok sayılır."
          error={state.fieldErrors?.price}
        >
          <Input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial.price ?? ""}
          />
        </Field>

        {/* Optional measure prices (Kadeh/Şişe, CL sizes). When any exist, they
            supersede the single price. */}
        <div className="flex flex-col gap-2">
          <span className="font-body text-xs text-muted">
            Ölçülü fiyatlar (Kadeh/Şişe — opsiyonel)
          </span>
          <span className="font-body text-[0.6875rem] text-muted/80">
            Aynı ürünün farklı ölçüleri için (örn. Kadeh ve Şişe ayrı fiyat). Eklenirse
            yukarıdaki tek fiyat kullanılmaz.
          </span>
          {measures.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Input
                name="priceLabel"
                placeholder="Ölçü (ör. Kadeh)"
                value={m.label}
                onChange={(e) => setMeasure(m.id, "label", e.target.value)}
                className="flex-1"
              />
              <Input
                name="priceAmount"
                type="number"
                min={0}
                step="0.01"
                placeholder="Fiyat"
                value={m.amount}
                onChange={(e) => setMeasure(m.id, "amount", e.target.value)}
                className="w-24"
              />
              <button
                type="button"
                aria-label="Ölçüyü kaldır"
                onClick={() => removeMeasure(m.id)}
                className="text-muted transition-colors hover:text-mono-red"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-1 self-start px-2 py-1 text-xs"
            onClick={addMeasure}
          >
            <Plus size={14} aria-hidden /> Ölçü ekle
          </Button>
          {measures.length > 0 && (
            <p className="font-body text-[0.6875rem] text-muted">
              Ölçü eklendiğinde tek fiyat yok sayılır.
            </p>
          )}
        </div>

        <Field
          label="Alt grup / etiket (opsiyonel)"
          hint={
            tagOptions.length
              ? `Mevcut alt gruplar: ${tagOptions.join(", ")}. Aynı adı yazan ürünler tek başlık altında toplanır.`
              : "Bir kategoriyi alt başlıklara ayırır (örn. içki ailesi: Viski, Rakı). Çoğu üründe boş kalır."
          }
          error={state.fieldErrors?.tag}
        >
          <Input name="tag" defaultValue={initial.tag} list="product-tags" />
          <datalist id="product-tags">
            {tagOptions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        {state.error && (
          <p className="font-body text-xs text-mono-red">{state.error}</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteModal({
  name,
  action,
  onClose,
  onDone,
}: {
  name: string;
  action: (formData: FormData) => Promise<void>;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="Silinsin mi?">
      <p className="mb-4 font-body text-sm">
        “{name}” ürünü menüden kaldırılacak (geri alınabilir).
      </p>
      <form
        action={async (formData) => {
          await action(formData);
          onDone();
        }}
        className="flex justify-end gap-2"
      >
        <Button type="button" variant="ghost" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit" variant="danger">
          Sil
        </Button>
      </form>
    </Modal>
  );
}

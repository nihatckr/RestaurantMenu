"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select } from "@/components/ui/form";
import type { ProductAdminRow } from "@/lib/data/admin";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
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
}: {
  locale: string;
  venueSlug: string;
  categorySlug: string;
  categoryOptions: CategoryOption[];
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
        className="flex items-center gap-1 whitespace-nowrap px-2 py-1 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus size={14} aria-hidden /> Ürün ekle
      </Button>
      {open && (
        <ProductFormModal
          title="Ürün ekle"
          action={createProductAction.bind(null, locale, venueSlug)}
          initial={{ categorySlug }}
          categoryOptions={categoryOptions}
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
  categoryOptions,
  overlay = false,
}: {
  locale: string;
  venueSlug: string;
  row: ProductAdminRow;
  categoryOptions: CategoryOption[];
  overlay?: boolean;
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
      </span>

      {editing === "edit" && (
        <ProductFormModal
          title="Ürünü düzenle"
          action={updateProductAction.bind(null, locale, venueSlug, row.id)}
          initial={row}
          categoryOptions={categoryOptions}
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
  onClose,
  onDone,
}: {
  title: string;
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initial: Initial;
  categoryOptions: CategoryOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <Modal open onClose={onClose} title={title}>
      <form action={formAction} className="flex flex-col gap-3">
        <Field label="Ad (Türkçe)" error={state.fieldErrors?.titleTr}>
          <Input name="titleTr" defaultValue={initial.titleTr} required autoFocus />
        </Field>
        <Field label="Ad (İngilizce)" error={state.fieldErrors?.titleEn}>
          <Input name="titleEn" defaultValue={initial.titleEn} />
        </Field>
        <Field label="Ad (Rusça)" error={state.fieldErrors?.titleRu}>
          <Input name="titleRu" defaultValue={initial.titleRu} />
        </Field>
        <Field label="Kategori" error={state.fieldErrors?.categorySlug}>
          <Select name="categorySlug" defaultValue={initial.categorySlug} required>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nameTr}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tür" error={state.fieldErrors?.kind}>
          <Select name="kind" defaultValue={initial.kind ?? "FOOD"}>
            <option value="FOOD">Yemek</option>
            <option value="DRINK">İçecek</option>
          </Select>
        </Field>
        <Field label="Fiyat (opsiyonel)" error={state.fieldErrors?.price}>
          <Input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial.price ?? ""}
          />
        </Field>
        <Field label="Alt grup / etiket (opsiyonel)" error={state.fieldErrors?.tag}>
          <Input name="tag" defaultValue={initial.tag} />
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

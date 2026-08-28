"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ReorderButtons } from "@/components/ui/ReorderButtons";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/form";
import type { CategoryAdminRow } from "@/lib/data/admin";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  toggleCategoryVisibilityAction,
  moveCategoryAction,
  type CategoryFormState,
} from "./category-actions";

type Editing =
  | { mode: "add" }
  | { mode: "edit"; row: CategoryAdminRow }
  | { mode: "delete"; row: CategoryAdminRow }
  | null;

// Admin-only inline category manager (shown on the venue landing when logged in).
export function CategoryManager({
  locale,
  venueSlug,
  categories,
}: {
  locale: string;
  venueSlug: string;
  categories: CategoryAdminRow[];
}) {
  const [editing, setEditing] = useState<Editing>(null);
  const router = useRouter();
  const close = useCallback(() => setEditing(null), []);
  const done = useCallback(() => {
    setEditing(null);
    router.refresh();
  }, [router]);

  const displayName = (row: CategoryAdminRow) =>
    (locale === "en" ? row.nameEn : locale === "ru" ? row.nameRu : row.nameTr) ||
    row.nameTr;

  return (
    <nav aria-label="Menu categories" className="w-full max-w-sm">
      <ul className="flex flex-col">
        {categories.map((row, index) => (
          <li key={row.id} className="flex items-center gap-2 py-1">
            {/* Same category link as guests see, plus inline admin controls.
                Hidden categories are greyed so the owner can still reach them. */}
            <Link
              href={`/${locale}/${venueSlug}/${row.slug}`}
              className={`type-heading flex-1 py-2 text-sm tracking-[0.6em] transition-colors hover:text-muted ${
                row.visible ? "text-foreground" : "text-foreground opacity-40"
              }`}
            >
              {displayName(row)}
            </Link>
            {/* Reorder within the venue menu (up/down; edges disabled). */}
            <ReorderButtons
              label={row.nameTr}
              upAction={moveCategoryAction.bind(null, locale, venueSlug, row.id, "up")}
              downAction={moveCategoryAction.bind(null, locale, venueSlug, row.id, "down")}
              canUp={index > 0}
              canDown={index < categories.length - 1}
            />
            <button
              type="button"
              aria-label={`${row.nameTr} düzenle`}
              onClick={() => setEditing({ mode: "edit", row })}
              className="text-muted transition-colors hover:text-foreground"
            >
              <Pencil size={16} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`${row.nameTr} sil`}
              onClick={() => setEditing({ mode: "delete", row })}
              className="text-muted transition-colors hover:text-mono-red"
            >
              <Trash2 size={16} aria-hidden />
            </button>
            {/* Show/hide in the public menu — a tiny form (works without JS). */}
            <form
              action={toggleCategoryVisibilityAction.bind(
                null,
                locale,
                venueSlug,
                row.id,
                !row.visible,
              )}
              className="flex"
            >
              <button
                type="submit"
                aria-label={row.visible ? `${row.nameTr} gizle` : `${row.nameTr} göster`}
                className="text-muted transition-colors hover:text-foreground"
              >
                {row.visible ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
              </button>
            </form>
          </li>
        ))}
      </ul>

      <Button
        variant="ghost"
        className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-xs"
        onClick={() => setEditing({ mode: "add" })}
      >
        <Plus size={14} aria-hidden /> Kategori ekle
      </Button>

      {editing?.mode === "add" && (
        <CategoryFormModal
          title="Kategori ekle"
          action={createCategoryAction.bind(null, locale, venueSlug)}
          onClose={close}
          onDone={done}
        />
      )}
      {editing?.mode === "edit" && (
        <CategoryFormModal
          title="Kategoriyi düzenle"
          action={updateCategoryAction.bind(null, locale, venueSlug, editing.row.id)}
          initial={editing.row}
          onClose={close}
          onDone={done}
        />
      )}
      {editing?.mode === "delete" && (
        <ConfirmModal
          title="Silinsin mi?"
          onConfirm={deleteCategoryAction.bind(null, locale, venueSlug, editing.row.id)}
          onClose={close}
        >
          “{editing.row.nameTr}” kategorisi menüden kaldırılacak (geri alınabilir).
        </ConfirmModal>
      )}
    </nav>
  );
}

function CategoryFormModal({
  title,
  action,
  initial,
  onClose,
  onDone,
}: {
  title: string;
  action: (prev: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  initial?: CategoryAdminRow;
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
        <p className="font-body text-xs text-muted">
          Kategori, menüdeki bir bölümdür (örn. Başlangıçlar). Adı üç dilde
          girebilirsin; İngilizce/Rusça boşsa Türkçesi gösterilir.
        </p>
        <Field
          label="Ad (Türkçe)"
          hint="Menüde ve kategori listesinde görünen ad."
          error={state.fieldErrors?.nameTr}
        >
          <Input name="nameTr" defaultValue={initial?.nameTr} required autoFocus />
        </Field>
        <Field
          label="Ad (İngilizce)"
          hint="Boş bırakılırsa Türkçesi gösterilir."
          error={state.fieldErrors?.nameEn}
        >
          <Input name="nameEn" defaultValue={initial?.nameEn} />
        </Field>
        <Field
          label="Ad (Rusça)"
          hint="Boş bırakılırsa Türkçesi gösterilir."
          error={state.fieldErrors?.nameRu}
        >
          <Input name="nameRu" defaultValue={initial?.nameRu} />
        </Field>
        <Field
          label="Sütun sayısı (opsiyonel)"
          hint="Fotoğrafların satır başına sayısı. 2 = büyük 2’li düzen (tatlı/kahvaltı); boş = otomatik."
          error={state.fieldErrors?.columns}
        >
          <Input
            name="columns"
            type="number"
            min={1}
            max={6}
            defaultValue={initial?.columns ?? ""}
          />
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


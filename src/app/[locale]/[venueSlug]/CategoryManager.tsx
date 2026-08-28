"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/form";
import type { CategoryAdminRow } from "@/lib/data/admin";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  toggleCategoryVisibilityAction,
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
        {categories.map((row) => (
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
        <DeleteModal
          name={editing.row.nameTr}
          action={deleteCategoryAction.bind(null, locale, venueSlug, editing.row.id)}
          onClose={close}
          onDone={done}
        />
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
        <Field label="Ad (Türkçe)" error={state.fieldErrors?.nameTr}>
          <Input name="nameTr" defaultValue={initial?.nameTr} required autoFocus />
        </Field>
        <Field label="Ad (İngilizce)" error={state.fieldErrors?.nameEn}>
          <Input name="nameEn" defaultValue={initial?.nameEn} />
        </Field>
        <Field label="Ad (Rusça)" error={state.fieldErrors?.nameRu}>
          <Input name="nameRu" defaultValue={initial?.nameRu} />
        </Field>
        <Field label="Sütun sayısı (opsiyonel)" error={state.fieldErrors?.columns}>
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
        “{name}” kategorisi menüden kaldırılacak (geri alınabilir).
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

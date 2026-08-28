"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { categorySchema } from "@/lib/schemas";
import {
  createCategory,
  updateCategory,
  softDeleteCategory,
  setCategoryVisibility,
  moveCategory,
  type MoveDirection,
} from "@/lib/data/admin";

export type CategoryFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parse(formData: FormData) {
  const columnsRaw = formData.get("columns");
  return categorySchema.safeParse({
    nameTr: String(formData.get("nameTr") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameRu: String(formData.get("nameRu") ?? ""),
    columns: columnsRaw ? Number(columnsRaw) : undefined,
  });
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

// Bound in the client with (locale, venueSlug) → (prevState, formData).
export async function createCategoryAction(
  locale: string,
  venueSlug: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: "Geçersiz giriş", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  await createCategory(venueSlug, parsed.data);
  revalidateMenu(venueSlug);
  return { ok: true };
}

// Bound with (locale, venueSlug, id) → (prevState, formData).
export async function updateCategoryAction(
  locale: string,
  venueSlug: string,
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: "Geçersiz giriş", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  await updateCategory(id, parsed.data);
  revalidateMenu(venueSlug);
  return { ok: true };
}

// Bound with (locale, venueSlug, id) → used as a <form action> (formData ignored).
export async function deleteCategoryAction(
  locale: string,
  venueSlug: string,
  id: string,
): Promise<void> {
  await requireAdmin();
  await softDeleteCategory(id);
  revalidateMenu(venueSlug);
}

// Bound with (locale, venueSlug, id, visible) → used as a <form action>.
export async function toggleCategoryVisibilityAction(
  locale: string,
  venueSlug: string,
  id: string,
  visible: boolean,
): Promise<void> {
  await requireAdmin();
  await setCategoryVisibility(venueSlug, id, visible);
  revalidateMenu(venueSlug);
}

// Bound with (locale, venueSlug, id, dir) → used as a <form action>.
export async function moveCategoryAction(
  locale: string,
  venueSlug: string,
  id: string,
  dir: MoveDirection,
): Promise<void> {
  await requireAdmin();
  await moveCategory(venueSlug, id, dir);
  revalidateMenu(venueSlug);
}

"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { audit } from "@/lib/data/audit";
import { categorySchema, zodFieldErrors } from "@/lib/schemas";
import {
  createCategory,
  updateCategory,
  softDeleteCategory,
  setCategoryVisibility,
  moveCategory,
  restoreCategory,
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
    return { error: "Geçersiz giriş", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  await createCategory(venueSlug, parsed.data);
  await audit("create", "category", parsed.data.nameTr);
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
    return { error: "Geçersiz giriş", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  await updateCategory(id, parsed.data);
  await audit("update", "category", parsed.data.nameTr);
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
  await audit("delete", "category");
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

// Bound with (id) → used as a <form action> (restore from trash; business-wide).
export async function restoreCategoryAction(id: string): Promise<void> {
  await requireAdmin();
  await restoreCategory(id);
  await audit("restore", "category");
  revalidateMenu();
}

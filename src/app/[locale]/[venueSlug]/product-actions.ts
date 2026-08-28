"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { productSchema } from "@/lib/schemas";
import {
  createProduct,
  updateProduct,
  softDeleteProduct,
  setProductAvailability,
  moveProduct,
  type MoveDirection,
} from "@/lib/data/admin";

export type ProductFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parse(formData: FormData) {
  const priceRaw = formData.get("price");
  return productSchema.safeParse({
    titleTr: String(formData.get("titleTr") ?? ""),
    titleEn: String(formData.get("titleEn") ?? ""),
    titleRu: String(formData.get("titleRu") ?? ""),
    categorySlug: String(formData.get("categorySlug") ?? ""),
    kind: String(formData.get("kind") ?? "FOOD"),
    tag: String(formData.get("tag") ?? ""),
    price: priceRaw ? Number(priceRaw) : undefined,
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

// Bound with (locale, venueSlug) → (prevState, formData).
export async function createProductAction(
  locale: string,
  venueSlug: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: "Geçersiz giriş", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  await createProduct(venueSlug, parsed.data);
  revalidateMenu(venueSlug);
  return { ok: true };
}

// Bound with (locale, venueSlug, id) → (prevState, formData).
export async function updateProductAction(
  locale: string,
  venueSlug: string,
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: "Geçersiz giriş", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  await updateProduct(id, venueSlug, parsed.data);
  revalidateMenu(venueSlug);
  return { ok: true };
}

// Bound with (locale, venueSlug, id) → used as a <form action>.
export async function deleteProductAction(
  locale: string,
  venueSlug: string,
  id: string,
): Promise<void> {
  await requireAdmin();
  await softDeleteProduct(id);
  revalidateMenu(venueSlug);
}

// Bound with (locale, venueSlug, id, available) → used as a <form action>.
export async function toggleProductAvailabilityAction(
  locale: string,
  venueSlug: string,
  id: string,
  available: boolean,
): Promise<void> {
  await requireAdmin();
  await setProductAvailability(venueSlug, id, available);
  revalidateMenu(venueSlug);
}

// Bound with (locale, venueSlug, id, dir) → used as a <form action>.
export async function moveProductAction(
  locale: string,
  venueSlug: string,
  id: string,
  dir: MoveDirection,
): Promise<void> {
  await requireAdmin();
  await moveProduct(venueSlug, id, dir);
  revalidateMenu(venueSlug);
}

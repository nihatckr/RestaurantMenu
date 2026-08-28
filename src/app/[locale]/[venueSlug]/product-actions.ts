"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { uploadImage, ImageError } from "@/lib/images";
import { productSchema } from "@/lib/schemas";
import {
  createProduct,
  updateProduct,
  softDeleteProduct,
  setProductAvailability,
  moveProduct,
  restoreProduct,
  type MoveDirection,
} from "@/lib/data/admin";

export type ProductFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parse(formData: FormData) {
  const priceRaw = formData.get("price");
  // Measure rows arrive as parallel priceLabel[]/priceAmount[] fields; zip them,
  // dropping blank rows (a measure needs a label).
  const labels = formData.getAll("priceLabel").map(String);
  const amounts = formData.getAll("priceAmount").map(String);
  const prices = labels
    .map((label, i) => ({ label: label.trim(), amount: amounts[i] ?? "" }))
    .filter((r) => r.label !== "")
    .map((r) => ({ label: r.label, amount: Number(r.amount || 0) }));

  return productSchema.safeParse({
    titleTr: String(formData.get("titleTr") ?? ""),
    titleEn: String(formData.get("titleEn") ?? ""),
    titleRu: String(formData.get("titleRu") ?? ""),
    categorySlug: String(formData.get("categorySlug") ?? ""),
    kind: String(formData.get("kind") ?? "FOOD"),
    tag: String(formData.get("tag") ?? ""),
    price: priceRaw ? Number(priceRaw) : undefined,
    prices: prices.length ? prices : undefined,
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

// Resolve the image side-effect from the form: a new file → optimize+upload and
// return its URL; "removeImage" checked → null (clear); otherwise undefined
// (leave unchanged). Throws ImageError with a Turkish message on bad input.
async function resolveImage(
  formData: FormData,
): Promise<string | null | undefined> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    return uploadImage(file, "products");
  }
  return formData.get("removeImage") === "on" ? null : undefined;
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
  let image: string | null | undefined;
  try {
    image = await resolveImage(formData);
  } catch (e) {
    return { error: e instanceof ImageError ? e.message : "Görsel yüklenemedi" };
  }
  await createProduct(venueSlug, parsed.data, image ?? null);
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
  let image: string | null | undefined;
  try {
    image = await resolveImage(formData);
  } catch (e) {
    return { error: e instanceof ImageError ? e.message : "Görsel yüklenemedi" };
  }
  await updateProduct(id, venueSlug, parsed.data, image);
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

// Bound with (id) → used as a <form action> (restore from trash; business-wide).
export async function restoreProductAction(id: string): Promise<void> {
  await requireAdmin();
  await restoreProduct(id);
  revalidateMenu();
}

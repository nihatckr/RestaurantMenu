"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { resolveUploadedImage, ImageError } from "@/lib/images";
import { audit } from "@/lib/data/audit";
import { productSchema, zodFieldErrors } from "@/lib/schemas";
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

  const caloriesRaw = formData.get("calories");
  return productSchema.safeParse({
    titleTr: String(formData.get("titleTr") ?? ""),
    titleEn: String(formData.get("titleEn") ?? ""),
    titleRu: String(formData.get("titleRu") ?? ""),
    descriptionTr: String(formData.get("descriptionTr") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    descriptionRu: String(formData.get("descriptionRu") ?? ""),
    calories: caloriesRaw ? Number(caloriesRaw) : undefined,
    categorySlug: String(formData.get("categorySlug") ?? ""),
    kind: String(formData.get("kind") ?? "FOOD"),
    tag: String(formData.get("tag") ?? ""),
    price: priceRaw ? Number(priceRaw) : undefined,
    prices: prices.length ? prices : undefined,
  });
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
    return { error: "Geçersiz giriş", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  let image: string | null | undefined;
  try {
    image = await resolveUploadedImage(formData, "products");
  } catch (e) {
    return { error: e instanceof ImageError ? e.message : "Görsel yüklenemedi" };
  }
  await createProduct(venueSlug, parsed.data, image ?? null);
  await audit("create", "product", parsed.data.titleTr);
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
    return { error: "Geçersiz giriş", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  let image: string | null | undefined;
  try {
    image = await resolveUploadedImage(formData, "products");
  } catch (e) {
    return { error: e instanceof ImageError ? e.message : "Görsel yüklenemedi" };
  }
  await updateProduct(id, venueSlug, parsed.data, image);
  await audit("update", "product", parsed.data.titleTr);
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
  await audit("delete", "product");
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
  await audit("restore", "product");
  revalidateMenu();
}

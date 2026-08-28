"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { uploadImage, ImageError } from "@/lib/images";
import { setBrandLogo, setVenueWordmark } from "@/lib/data/settings";
import { importBackup } from "@/lib/data/backup-import";
import { audit } from "@/lib/data/audit";

export type SettingsFormState = { ok?: boolean; error?: string };

export type ImportState = {
  ok?: boolean;
  error?: string;
  errors?: string[];
  counts?: { categories: number; products: number; items: number };
};

// Same file semantics as the product image: new file → optimize+upload; remove
// checked → null; neither → undefined (no change).
async function resolveImage(
  formData: FormData,
  prefix: string,
): Promise<string | null | undefined> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) return uploadImage(file, prefix);
  return formData.get("removeImage") === "on" ? null : undefined;
}

// Bound in the client as (prevState, formData).
export async function updateBrandLogoAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();
  let image: string | null | undefined;
  try {
    image = await resolveImage(formData, "brand");
  } catch (e) {
    return { error: e instanceof ImageError ? e.message : "Görsel yüklenemedi" };
  }
  if (image === undefined) return { ok: true }; // nothing submitted
  await setBrandLogo(image);
  await audit("settings", "brand", image ? "logo güncellendi" : "logo kaldırıldı");
  revalidateMenu();
  return { ok: true };
}

// Bound with (venueSlug) → (prevState, formData).
export async function updateVenueWordmarkAction(
  venueSlug: string,
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();
  let image: string | null | undefined;
  try {
    image = await resolveImage(formData, `venues/${venueSlug}`);
  } catch (e) {
    return { error: e instanceof ImageError ? e.message : "Görsel yüklenemedi" };
  }
  if (image === undefined) return { ok: true };
  await setVenueWordmark(venueSlug, image);
  await audit("settings", "wordmark", venueSlug);
  revalidateMenu(venueSlug);
  return { ok: true };
}

// Import an Excel backup (upsert). Validates first; on any error nothing is
// written and the row messages come back for display.
export async function importBackupAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Dosya seçin." };
  if (file.size > 10 * 1024 * 1024) return { error: "Dosya çok büyük (>10MB)." };

  const result = await importBackup(await file.arrayBuffer());
  if (!result.ok) return { errors: result.errors };
  await audit(
    "import",
    "backup",
    `${result.counts.categories} kategori, ${result.counts.products} ürün, ${result.counts.items} yerleşim`,
  );
  revalidateMenu();
  return { ok: true, counts: result.counts };
}

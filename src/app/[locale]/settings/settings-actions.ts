"use server";

import { requireAdmin, verifyPassword, setPassword, setUsername } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { uploadImage, ImageError } from "@/lib/images";
import { setBrandLogo, setVenueWordmark, setBusinessInfo } from "@/lib/data/settings";
import { emptyTrash } from "@/lib/data/admin";
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

// Business name + optional extra footer line.
export async function updateBusinessInfoAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const footerExtra = String(formData.get("footerExtra") ?? "").trim();
  if (name.length < 1) return { error: "İşletme adı zorunlu." };
  if (name.length > 120 || footerExtra.length > 200) return { error: "Girdi çok uzun." };
  await setBusinessInfo(name, footerExtra || null);
  await audit("settings", "business", "işletme bilgileri güncellendi");
  revalidateMenu();
  return { ok: true };
}

export type PasswordState = { ok?: boolean; error?: string };

// Change the admin username (login identity).
export async function changeUsernameAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  await requireAdmin();
  const username = String(formData.get("username") ?? "").trim();
  if (username.length < 3) return { error: "Kullanıcı adı en az 3 karakter olmalı." };
  if (username.length > 40) return { error: "Kullanıcı adı çok uzun." };
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return { error: "Sadece harf, rakam, nokta, alt çizgi ve tire kullanın." };
  }
  try {
    await setUsername(username);
  } catch {
    return { error: "Bu kullanıcı adı kullanılamıyor." };
  }
  await audit("settings", "password", `kullanıcı adı: ${username}`);
  return { ok: true };
}

// Change the admin password (requires the current one).
export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!(await verifyPassword(current))) return { error: "Mevcut şifre hatalı." };
  if (next.length < 4) return { error: "Yeni şifre en az 4 karakter olmalı." };
  if (next.length > 100) return { error: "Yeni şifre çok uzun." };
  if (next !== confirm) return { error: "Yeni şifreler eşleşmiyor." };

  await setPassword(next);
  await audit("settings", "password", "şifre değiştirildi");
  return { ok: true };
}

// Permanently empty the trash (irreversible). Used as a plain <form action>.
export async function emptyTrashAction(): Promise<void> {
  await requireAdmin();
  const { categories, products } = await emptyTrash();
  await audit(
    "delete",
    "trash",
    `çöp boşaltıldı — ${categories} kategori, ${products} ürün kalıcı silindi`,
  );
  revalidateMenu();
}

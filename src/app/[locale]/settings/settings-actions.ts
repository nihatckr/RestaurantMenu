"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { uploadImage, ImageError } from "@/lib/images";
import { setBrandLogo, setVenueWordmark } from "@/lib/data/settings";

export type SettingsFormState = { ok?: boolean; error?: string };

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
  revalidateMenu(venueSlug);
  return { ok: true };
}

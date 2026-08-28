"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidateMenu } from "@/lib/cache";
import { audit } from "@/lib/data/audit";
import {
  createVenue,
  updateVenueName,
  deleteVenue,
  moveVenue,
  type MoveDirection,
} from "@/lib/data/venues";

export type VenueFormState = { ok?: boolean; error?: string };

// Bound as (prevState, formData).
export async function createVenueAction(
  _prev: VenueFormState,
  formData: FormData,
): Promise<VenueFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1) return { error: "Mekan adı zorunlu." };
  if (name.length > 80) return { error: "Mekan adı çok uzun." };
  await createVenue(name);
  await audit("create", "venue", name);
  revalidateMenu();
  return { ok: true };
}

// Bound with (venueSlug) → (prevState, formData).
export async function updateVenueNameAction(
  venueSlug: string,
  _prev: VenueFormState,
  formData: FormData,
): Promise<VenueFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1) return { error: "Mekan adı zorunlu." };
  if (name.length > 80) return { error: "Mekan adı çok uzun." };
  await updateVenueName(venueSlug, name);
  await audit("update", "venue", name);
  revalidateMenu(venueSlug);
  return { ok: true };
}

// Bound with (venueSlug) → used as a <form action>.
export async function deleteVenueAction(venueSlug: string): Promise<void> {
  await requireAdmin();
  await deleteVenue(venueSlug);
  await audit("delete", "venue", venueSlug);
  revalidateMenu();
}

// Bound with (venueSlug, dir) → used as a <form action>.
export async function moveVenueAction(
  venueSlug: string,
  dir: MoveDirection,
): Promise<void> {
  await requireAdmin();
  await moveVenue(venueSlug, dir);
  revalidateMenu();
}

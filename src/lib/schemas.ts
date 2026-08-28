import { z } from "zod";
import { config } from "@/lib/config";

// Validation schemas shared by the client forms and the server actions (the server
// re-validates — never trusts the client). Admin content (ADMIN_PLAN.md §5).

/** Map zod issues → { field: firstMessage } for form field-level errors. Shared
 *  by the category/product server actions. */
export function zodFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

export const categorySchema = z.object({
  nameTr: z.string().trim().min(1, "Türkçe ad zorunlu").max(80),
  nameEn: z.string().trim().max(80).optional().or(z.literal("")),
  nameRu: z.string().trim().max(80).optional().or(z.literal("")),
  // Photo-grid column override (desserts/breakfast = 2); empty = default.
  columns: z.coerce.number().int().min(1).max(6).optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// One labelled measure (e.g. "Kadeh"/"Şişe", "4 CL") with its price.
export const measureSchema = z.object({
  label: z.string().trim().min(1, "Ölçü adı zorunlu").max(40),
  amount: z.coerce.number().min(0).max(config.price.max),
});

export const productSchema = z.object({
  titleTr: z.string().trim().min(1, "Türkçe ad zorunlu").max(120),
  titleEn: z.string().trim().max(120).optional().or(z.literal("")),
  titleRu: z.string().trim().max(120).optional().or(z.literal("")),
  descriptionTr: z.string().trim().max(300).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(300).optional().or(z.literal("")),
  descriptionRu: z.string().trim().max(300).optional().or(z.literal("")),
  calories: z.coerce.number().int().min(0).max(100000).optional(),
  categorySlug: z.string().trim().min(1, "Kategori seçin"),
  kind: z.enum(["FOOD", "DRINK"]),
  tag: z.string().trim().max(40).optional().or(z.literal("")),
  // Single price (TRY). Optional — priceless items, or superseded by `prices`.
  price: z.coerce.number().min(0).max(config.price.max).optional(),
  // Labelled measures (Kadeh/Şişe, CL sizes). When non-empty, the single price is
  // ignored and the item is measure-priced (legacy hard drinks / wines).
  prices: z.array(measureSchema).max(6).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

import { z } from "zod";

// Validation schemas shared by the client forms and the server actions (the server
// re-validates — never trusts the client). Admin content (ADMIN_PLAN.md §5).

export const categorySchema = z.object({
  nameTr: z.string().trim().min(1, "Türkçe ad zorunlu").max(80),
  nameEn: z.string().trim().max(80).optional().or(z.literal("")),
  nameRu: z.string().trim().max(80).optional().or(z.literal("")),
  // Photo-grid column override (desserts/breakfast = 2); empty = default.
  columns: z.coerce.number().int().min(1).max(6).optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  titleTr: z.string().trim().min(1, "Türkçe ad zorunlu").max(120),
  titleEn: z.string().trim().max(120).optional().or(z.literal("")),
  titleRu: z.string().trim().max(120).optional().or(z.literal("")),
  categorySlug: z.string().trim().min(1, "Kategori seçin"),
  kind: z.enum(["FOOD", "DRINK"]),
  tag: z.string().trim().max(40).optional().or(z.literal("")),
  // Single price (TRY). Optional — some items are priceless / measure-priced (later).
  price: z.coerce.number().min(0).max(1_000_000).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

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

// Controlled diet/allergen vocabulary shown as badges on the menu + checkboxes in
// the product form. Values are stored on `Product.dietary` (String[]); labels are
// localized for the public menu (tr/en/ru) with a Turkish label for the admin.

export const DIETARY_TAGS = [
  "vegan",
  "vegetarian",
  "gluten_free",
  "spicy",
  "halal",
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const DIETARY_LABELS: Record<
  DietaryTag,
  { tr: string; en: string; ru: string }
> = {
  vegan: { tr: "Vegan", en: "Vegan", ru: "Веган" },
  vegetarian: { tr: "Vejetaryen", en: "Vegetarian", ru: "Вегетар." },
  gluten_free: { tr: "Glutensiz", en: "Gluten-free", ru: "Без глютена" },
  spicy: { tr: "Acı", en: "Spicy", ru: "Острое" },
  halal: { tr: "Helal", en: "Halal", ru: "Халяль" },
};

export function isDietaryTag(v: string): v is DietaryTag {
  return (DIETARY_TAGS as readonly string[]).includes(v);
}

/** Localized badge label for a stored tag (falls back to the raw value). */
export function dietaryLabel(tag: string, locale: string): string {
  const l = DIETARY_LABELS[tag as DietaryTag];
  if (!l) return tag;
  return l[(locale as "tr" | "en" | "ru") in l ? (locale as "tr" | "en" | "ru") : "tr"];
}

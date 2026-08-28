// URL-safe slug from arbitrary text (Turkish chars → ASCII). Category/product slugs
// are language-neutral, stable keys — generated once, then kept.
const MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i",
};

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[çğıöşüİ]/g, (c) => MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip remaining diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Append -2, -3, … until the slug is unique among `existing`. */
export function uniqueSlug(base: string, existing: Set<string>): string {
  const slug = base || "item";
  if (!existing.has(slug)) return slug;
  let n = 2;
  while (existing.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

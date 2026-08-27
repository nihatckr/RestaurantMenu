// Localization helpers (I18N.md). Default locale is Turkish; missing
// translations fall back to tr, never blank. Supported locales come from the
// business (currently tr/en/ru) — kept here as a constant for now; a later i18n
// task moves locale into the route and reads the supported set from data.

export const DEFAULT_LOCALE = "tr";
export const LOCALES = ["tr", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

/** Pick the row for `locale`, falling back to tr, then to the first available. */
export function pickLocalized<T extends { locale: string }>(
  rows: T[],
  locale: string = DEFAULT_LOCALE,
): T | undefined {
  return (
    rows.find((r) => r.locale === locale) ??
    rows.find((r) => r.locale === DEFAULT_LOCALE) ??
    rows[0]
  );
}

/**
 * Bilingual value: the primary text (in `locale`) plus an alternate-language
 * line — legacy showed both languages together. The alternate is English (or
 * Turkish when the primary is English). `secondary` is null when the alternate
 * is missing or identical (avoids a redundant line).
 */
export function bilingual<T extends { locale: string }>(
  rows: T[],
  getValue: (row: T) => string | null | undefined,
  locale: string = DEFAULT_LOCALE,
): { primary: string; secondary: string | null } {
  const primaryRow = pickLocalized(rows, locale);
  const primary = (primaryRow && getValue(primaryRow)) || "";
  const altLocale = locale === "en" ? "tr" : "en";
  const altRow = rows.find((r) => r.locale === altLocale);
  const altValue = altRow ? getValue(altRow) : null;
  const secondary = altValue && altValue !== primary ? altValue : null;
  return { primary, secondary };
}

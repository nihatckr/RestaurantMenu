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

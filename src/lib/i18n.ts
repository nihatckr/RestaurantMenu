// Localization helpers (I18N.md). Default locale is Turkish; missing
// translations fall back to tr, never blank. Locale lives in the route
// (`/[locale]/…`) so each language renders a single-language page that stays
// static / cache-friendly (the cache key includes the locale). The supported
// set is a constant for now; a later task can read it from the business data.

export const DEFAULT_LOCALE = "tr";
export const LOCALES = ["tr", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

// Human-readable names for the language switcher (shown in each language's own
// script so a guest recognises their language).
export const LOCALE_LABELS: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  ru: "РУ",
};

/** Narrow an arbitrary route segment to a supported locale. */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

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
 * The value for `locale` from a set of translation rows, falling back to tr then
 * the first available (never blank). Used to render a single-language page.
 */
export function localized<T extends { locale: string }>(
  rows: T[],
  getValue: (row: T) => string | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string | null {
  const row = pickLocalized(rows, locale);
  return (row && getValue(row)) || null;
}

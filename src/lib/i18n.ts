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

/**
 * The locale from a pathname's first segment (`/tr/…` → `tr`), or the default
 * when unsupported/missing. For client contexts that only have the URL (e.g. the
 * error boundary) where route params aren't available.
 */
export function localeFromPathname(pathname: string | null | undefined): Locale {
  const seg = (pathname ?? "").split("/")[1] ?? "";
  return isLocale(seg) ? seg : DEFAULT_LOCALE;
}

/**
 * `Metadata.alternates` for a menu path: the canonical (current locale) plus one
 * `hreflang` link per supported locale and an `x-default`. `pathAfterLocale` is the
 * path *without* the locale segment, e.g. `/terrace` or `/terrace/starters`. URLs
 * are relative — Next resolves them against `metadataBase` (SITE_URL). Built from
 * `LOCALES`, so a new language needs no change here.
 */
export function buildAlternates(locale: string, pathAfterLocale: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `/${l}${pathAfterLocale}`;
  languages["x-default"] = `/${DEFAULT_LOCALE}${pathAfterLocale}`;
  return { canonical: `/${locale}${pathAfterLocale}`, languages };
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

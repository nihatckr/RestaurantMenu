"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

// Language switcher (I18N.md): the menu renders in ONE language at a time and the
// locale lives in the first path segment (`/[locale]/…`), so switching just swaps
// that segment while preserving the current venue/category. Links are real
// <Link>s (not client state), so each language stays a static, cacheable URL and
// the choice survives reloads/sharing.
export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() ?? `/${current}`;

  // Replace the locale segment: "/tr/terrace/starters" -> "/en/terrace/starters".
  const withLocale = (locale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = locale; // segments[0] is "" (leading slash)
    return segments.join("/") || `/${locale}`;
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Dil / Language">
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={withLocale(locale)}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            className={`rounded border px-2 py-1 font-body text-[0.625rem] uppercase tracking-wider transition-colors ${
              active
                ? "border-foreground text-foreground"
                : "border-muted/40 text-muted hover:text-foreground"
            }`}
          >
            {LOCALE_LABELS[locale]}
          </Link>
        );
      })}
    </div>
  );
}

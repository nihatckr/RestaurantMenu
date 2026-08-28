import Link from "next/link";
import { locale as getLocale } from "next/root-params";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";

// 404 page, localized to the current [locale] segment (read via next/root-params
// since not-found receives no params). Falls back to the default language.
export default async function NotFound() {
  const raw = (await getLocale()) ?? DEFAULT_LOCALE;
  const loc = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = getMessages(loc);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-brand text-xl tracking-[0.15em]">404</h1>
      <p className="font-body text-sm text-muted">{t.notFoundBody}</p>
      <Link href={`/${loc}`} className="font-body text-sm underline">
        {t.backToMenu}
      </Link>
    </main>
  );
}

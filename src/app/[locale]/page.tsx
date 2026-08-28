import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listVenues } from "@/lib/data/menu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AdminSessionControls } from "@/components/AdminSessionControls";
import { LOCALES, isLocale } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Root of a locale: venue chooser. `listVenues` is cached, so this prerenders
// static per locale.
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const venues = await listVenues();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex w-full max-w-sm items-center justify-end gap-3">
        <Suspense fallback={null}>
          <AdminSessionControls locale={locale} />
        </Suspense>
        <LanguageSwitcher current={locale} />
      </div>
      <Image src={BRAND.mark} alt={BRAND.name} width={72} height={88} priority />
      <ul className="flex w-full max-w-sm flex-col gap-3">
        {venues.map((v) => (
          <li key={v.slug}>
            <Link
              href={`/${locale}/${v.slug}`}
              className="flex items-center justify-center rounded-md border border-muted/20 py-4 font-brand text-sm uppercase tracking-[0.2em] transition-colors hover:border-foreground"
            >
              {v.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CategorySection } from "@/components/CategorySection";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Spinner } from "@/components/Spinner";
import { getVenueBySlug, getVenueMenu, listVenueSlugs } from "@/lib/data/menu";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";

// Prerender every (locale, venue, visible category). Guarded so a DB-less build
// (CI) still succeeds. cacheComponents requires ≥1 param.
export async function generateStaticParams() {
  const fallback = LOCALES.map((locale) => ({
    locale,
    venueSlug: "terrace",
    categorySlug: "starters",
  }));
  try {
    const slugs = await listVenueSlugs();
    const params: { locale: string; venueSlug: string; categorySlug: string }[] = [];
    for (const locale of LOCALES) {
      for (const venueSlug of slugs) {
        const menu = await getVenueMenu(venueSlug, locale);
        for (const c of menu ?? []) {
          params.push({ locale, venueSlug, categorySlug: c.slug });
        }
      }
    }
    return params.length ? params : fallback;
  } catch {
    return fallback;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; venueSlug: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { locale, venueSlug, categorySlug } = await params;
  const [venue, menu] = await Promise.all([
    getVenueBySlug(venueSlug),
    getVenueMenu(venueSlug, locale),
  ]);
  const category = menu?.find((c) => c.slug === categorySlug);
  if (!venue || !category) return {};
  return {
    title: `${category.name} · ${venue.name}`,
    description: `${venue.name} — ${category.name}`,
    openGraph: { title: `${category.name} · ${venue.name}` },
  };
}

// T7: single-scroll category page — the chosen category first, then the rest
// (PR7). Only visible categories exist in the menu, so hidden ones (e.g.
// Breakfast on Terrace) 404 here and never appear below.
export default async function CategoryPage({
  params,
}: PageProps<"/[locale]/[venueSlug]/[categorySlug]">) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6">
      <Suspense fallback={<Spinner />}>
        <CategoryView params={params} />
      </Suspense>
    </main>
  );
}

async function CategoryView({
  params,
}: {
  params: Promise<{ locale: string; venueSlug: string; categorySlug: string }>;
}) {
  const { locale, venueSlug, categorySlug } = await params;
  if (!isLocale(locale)) notFound();

  const venue = await getVenueBySlug(venueSlug);
  if (!venue) notFound();

  const menu = await getVenueMenu(venueSlug, locale);
  if (!menu) notFound();

  const chosen = menu.find((c) => c.slug === categorySlug);
  if (!chosen) notFound(); // unknown or not-visible category for this venue

  const ordered = [chosen, ...menu.filter((c) => c.slug !== categorySlug)];

  return (
    <div className="flex w-full max-w-md flex-col gap-6 sm:max-w-2xl lg:max-w-4xl">
      {/* Brand header (Figma: MONO mark centered at top of every menu screen). */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between">
          <Link
            href={`/${locale}/${venueSlug}`}
            className="-my-1 py-2 font-body text-xs text-muted underline"
          >
            &lsaquo; {venue.name}
          </Link>
          <LanguageSwitcher current={locale as Locale} />
        </div>
        <div className="relative h-16 w-14">
          <Image
            src="/brand/mono.svg"
            alt="Mono"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {ordered.map((category) => (
        <CategorySection key={category.slug} category={category} />
      ))}

      {/* Brand footer (Figma: MONO TERRACE wordmark centered at the bottom). */}
      <footer className="flex justify-center py-8">
        <div className="relative h-10 w-36">
          <Image
            src={venue.wordmark || "/brand/mono.svg"}
            alt={venue.name}
            fill
            className="object-contain"
          />
        </div>
      </footer>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CategorySection } from "@/components/CategorySection";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Spinner } from "@/components/Spinner";
import { getVenueBySlug, getVenueMenu, listVenueSlugs } from "@/lib/data/menu";
import { LOCALES, isLocale, buildAlternates, type Locale } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { BUILD_FALLBACK } from "@/lib/site";

// Prerender every (locale, venue, visible category). Guarded so a DB-less build
// (CI) still succeeds. cacheComponents requires ≥1 param.
export async function generateStaticParams() {
  const fallback = LOCALES.map((locale) => ({
    locale,
    venueSlug: BUILD_FALLBACK.venueSlug,
    categorySlug: BUILD_FALLBACK.categorySlug,
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
  // No explicit `openGraph` — og:title falls back to `title`, and dropping it lets
  // the shared opengraph-image (parent segment) flow through as og:image.
  return {
    title: `${category.name} · ${venue.name}`,
    description: `${venue.name} — ${category.name}`,
    alternates: buildAlternates(locale, `/${venueSlug}/${categorySlug}`),
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
      {/* Slim sticky control bar: back-link + language switcher stay reachable at
          any scroll depth on the long single-scroll page. Direct child of the tall
          container (so `sticky` holds for the whole scroll, not just a short
          header). Full-bleed on phones via negative margins over main's padding;
          the brand mark below scrolls normally under it. */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-muted/10 bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href={`/${locale}/${venueSlug}`}
          className="py-1 font-body text-xs text-muted underline"
        >
          &lsaquo; {venue.name}
        </Link>
        <LanguageSwitcher current={locale as Locale} />
      </div>

      {/* Brand mark (Figma: MONO mark near the top). Scrolls normally. */}
      <div className="flex justify-center">
        <Link
          href={`/${locale}/${venueSlug}`}
          aria-label={BRAND.name}
          className="relative block h-16 w-14"
        >
          <Image
            src={BRAND.mark}
            alt={BRAND.name}
            fill
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {ordered.map((category) => (
        <CategorySection key={category.slug} category={category} />
      ))}

      {/* Brand footer (Figma: MONO TERRACE wordmark centered at the bottom).
          Links back to the venue landing (the menu "home"). */}
      <footer className="flex justify-center py-8">
        <Link
          href={`/${locale}/${venueSlug}`}
          aria-label={venue.name}
          className="relative block h-10 w-36"
        >
          <Image
            src={venue.wordmark || BRAND.mark}
            alt={venue.name}
            fill
            className="object-contain"
          />
        </Link>
      </footer>
    </div>
  );
}

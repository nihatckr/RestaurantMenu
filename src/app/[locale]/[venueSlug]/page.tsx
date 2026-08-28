import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { VenueHeader } from "@/components/VenueHeader";
import { CategoryNavIsland } from "./CategoryNavIsland";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Spinner } from "@/components/Spinner";
import { getVenueBySlug, getVenueMenu, listVenueSlugs } from "@/lib/data/menu";
import { buildMenuJsonLd } from "@/lib/jsonld";
import { LOCALES, isLocale, buildAlternates, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";
import { BRAND } from "@/lib/brand";
import { BUILD_FALLBACK } from "@/lib/site";

// Prerender each (locale, venue). Guarded so a DB-less build (CI) still succeeds.
// cacheComponents requires ≥1 param.
export async function generateStaticParams() {
  const fallback = LOCALES.map((locale) => ({
    locale,
    venueSlug: BUILD_FALLBACK.venueSlug,
  }));
  try {
    const slugs = await listVenueSlugs();
    const params = LOCALES.flatMap((locale) =>
      slugs.map((venueSlug) => ({ locale, venueSlug })),
    );
    return params.length ? params : fallback;
  } catch {
    return fallback;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; venueSlug: string }>;
}): Promise<Metadata> {
  const { locale, venueSlug } = await params;
  const venue = await getVenueBySlug(venueSlug);
  if (!venue) return {};
  const t = getMessages(locale);
  const title = `${venue.name} — ${t.metaMenuSuffix}`;
  // No explicit `openGraph` — og:title falls back to `title`, and dropping it lets
  // the shared opengraph-image (parent segment) flow through as og:image.
  return {
    title,
    description: t.venueMenuDescription(venue.name),
    alternates: buildAlternates(locale, `/${venueSlug}`),
  };
}

// T6 landing: venue wordmark + ordered category list.
export default async function VenueLandingPage({
  params,
}: PageProps<"/[locale]/[venueSlug]">) {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <Suspense fallback={<Spinner />}>
        <VenueLanding params={params} />
      </Suspense>
    </main>
  );
}

async function VenueLanding({
  params,
}: {
  params: Promise<{ locale: string; venueSlug: string }>;
}) {
  const { locale, venueSlug } = await params;
  if (!isLocale(locale)) notFound();

  const venue = await getVenueBySlug(venueSlug);
  if (!venue) notFound();

  const menu = await getVenueMenu(venueSlug, locale);
  const jsonLd = menu ? buildMenuJsonLd(venue.name, menu, locale) : null;
  return (
    <>
      {/* SEO structured data (schema.org Restaurant/Menu) — invisible; a data
          block, not executable JS, and rendered via React children (no
          dangerouslySetInnerHTML). */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
      <div className="flex w-full max-w-sm justify-end">
        <LanguageSwitcher current={locale as Locale} />
      </div>
      <VenueHeader name={venue.name} homeHref={`/${locale}`} />
      {/* One category list — guests see plain links, an admin sees the same list
          with inline edit/delete/add (session-aware island, Suspense-isolated). */}
      <Suspense fallback={<Spinner />}>
        <CategoryNavIsland locale={locale} venueSlug={venueSlug} />
      </Suspense>
      {/* Figma: MONO TERRACE wordmark anchored at the bottom of the landing.
          Links to the venue chooser (the locale root "home"). */}
      <footer className="mt-4 flex justify-center pb-2">
        <Link href={`/${locale}`} aria-label={venue.name} className="relative block h-10 w-36">
          <Image
            src={venue.wordmark || BRAND.mark}
            alt={venue.name}
            fill
            className="object-contain"
          />
        </Link>
      </footer>
    </>
  );
}

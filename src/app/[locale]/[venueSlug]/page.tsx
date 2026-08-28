import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { VenueHeader } from "@/components/VenueHeader";
import { CategoryNav } from "@/components/CategoryNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Spinner } from "@/components/Spinner";
import {
  getVenueBySlug,
  getVenueMenu,
  listVenueCategories,
  listVenueSlugs,
} from "@/lib/data/menu";
import { buildMenuJsonLd } from "@/lib/jsonld";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";

// Prerender each (locale, venue). Guarded so a DB-less build (CI) still succeeds.
// cacheComponents requires ≥1 param.
export async function generateStaticParams() {
  const fallback = LOCALES.map((locale) => ({ locale, venueSlug: "terrace" }));
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
  const { venueSlug } = await params;
  const venue = await getVenueBySlug(venueSlug);
  if (!venue) return {};
  return {
    title: `${venue.name} — Menü`,
    description: `${venue.name} menüsü.`,
    openGraph: { title: `${venue.name} — Menü` },
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

  const [categories, menu] = await Promise.all([
    listVenueCategories(venueSlug, locale),
    getVenueMenu(venueSlug, locale),
  ]);
  const jsonLd = menu ? buildMenuJsonLd(venue.name, menu) : null;
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
      <VenueHeader name={venue.name} />
      <CategoryNav locale={locale} venueSlug={venueSlug} categories={categories} />
      {/* Figma: MONO TERRACE wordmark anchored at the bottom of the landing. */}
      <footer className="mt-4 flex justify-center pb-2">
        <div className="relative h-10 w-36">
          <Image
            src={venue.wordmark || "/brand/mono.svg"}
            alt={venue.name}
            fill
            className="object-contain"
          />
        </div>
      </footer>
    </>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { VenueHeader } from "@/components/VenueHeader";
import { CategoryNav } from "@/components/CategoryNav";
import { Spinner } from "@/components/Spinner";
import {
  getVenueBySlug,
  getVenueMenu,
  listVenueCategories,
  listVenueSlugs,
} from "@/lib/data/menu";
import { buildMenuJsonLd } from "@/lib/jsonld";

// Known venues are prerendered; unknown slugs render on request and call
// notFound(). This is the Cache Components pattern (dynamicParams is removed
// under cacheComponents — migrating-to-cache-components guide): the `params`
// promise is passed into <Suspense> and awaited inside, so unknown params still
// produce a static shell, then the not-found boundary streams in. Guarded so a
// build without a database (e.g. CI) still succeeds.
export async function generateStaticParams() {
  try {
    const slugs = await listVenueSlugs();
    return slugs.map((venueSlug) => ({ venueSlug }));
  } catch {
    return [{ venueSlug: "terrace" }]; // cacheComponents requires ≥1 param
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
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
}: {
  params: Promise<{ venueSlug: string }>;
}) {
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
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;

  const venue = await getVenueBySlug(venueSlug);
  if (!venue) notFound();

  const [categories, menu] = await Promise.all([
    listVenueCategories(venueSlug),
    getVenueMenu(venueSlug),
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
      <VenueHeader name={venue.name} />
      <CategoryNav venueSlug={venueSlug} categories={categories} />
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

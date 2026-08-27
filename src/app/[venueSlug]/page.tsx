import { Suspense } from "react";
import { notFound } from "next/navigation";
import { VenueHeader } from "@/components/VenueHeader";
import { CategoryNav } from "@/components/CategoryNav";
import { Spinner } from "@/components/Spinner";
import {
  getVenueBySlug,
  listVenueCategories,
  listVenueSlugs,
} from "@/lib/data/menu";

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

  const categories = await listVenueCategories(venueSlug);
  return (
    <>
      <VenueHeader name={venue.name} />
      <CategoryNav venueSlug={venueSlug} categories={categories} />
    </>
  );
}

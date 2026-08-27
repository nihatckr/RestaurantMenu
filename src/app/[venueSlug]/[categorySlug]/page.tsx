import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CategorySection } from "@/components/CategorySection";
import { Spinner } from "@/components/Spinner";
import { getVenueBySlug, getVenueMenu, listVenueSlugs } from "@/lib/data/menu";

// Prerender every visible (venue, category) pair. Guarded so a DB-less build
// (CI) still succeeds. cacheComponents requires ≥1 param.
export async function generateStaticParams() {
  const fallback = [{ venueSlug: "terrace", categorySlug: "starters" }];
  try {
    const slugs = await listVenueSlugs();
    const params: { venueSlug: string; categorySlug: string }[] = [];
    for (const venueSlug of slugs) {
      const menu = await getVenueMenu(venueSlug);
      for (const c of menu ?? []) params.push({ venueSlug, categorySlug: c.slug });
    }
    return params.length ? params : fallback;
  } catch {
    return fallback;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueSlug: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { venueSlug, categorySlug } = await params;
  const [venue, menu] = await Promise.all([
    getVenueBySlug(venueSlug),
    getVenueMenu(venueSlug),
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
}: {
  params: Promise<{ venueSlug: string; categorySlug: string }>;
}) {
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
  params: Promise<{ venueSlug: string; categorySlug: string }>;
}) {
  const { venueSlug, categorySlug } = await params;

  const venue = await getVenueBySlug(venueSlug);
  if (!venue) notFound();

  const menu = await getVenueMenu(venueSlug);
  if (!menu) notFound();

  const chosen = menu.find((c) => c.slug === categorySlug);
  if (!chosen) notFound(); // unknown or not-visible category for this venue

  const ordered = [chosen, ...menu.filter((c) => c.slug !== categorySlug)];

  return (
    <div className="flex w-full max-w-md flex-col gap-6 sm:max-w-2xl lg:max-w-4xl">
      <Link
        href={`/${venueSlug}`}
        className="font-body text-xs text-muted underline"
      >
        &lsaquo; {venue.name}
      </Link>
      {ordered.map((category) => (
        <CategorySection key={category.slug} category={category} />
      ))}
    </div>
  );
}

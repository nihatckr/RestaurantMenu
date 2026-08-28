import Link from "next/link";
import type { CategoryLink } from "@/lib/data/menu";

// Ordered category list for a venue landing (DESIGN.md flow: landing → category
// page). Order comes from data (per-venue), not code (AGENTS.md 10). Names are
// already localized to `locale`; links keep the locale segment.
export function CategoryNav({
  locale,
  venueSlug,
  categories,
}: {
  locale: string;
  venueSlug: string;
  categories: CategoryLink[];
}) {
  if (categories.length === 0) {
    return (
      <p className="font-body text-sm text-muted">Bu mekân için menü bulunamadı.</p>
    );
  }
  return (
    <nav aria-label="Menu categories" className="w-full max-w-sm">
      <ul className="flex flex-col">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/${locale}/${venueSlug}/${c.slug}`}
              className="type-heading flex items-center justify-between py-3 tracking-[0.6em] text-foreground transition-colors hover:text-muted"
            >
              <span className="text-sm">{c.name}</span>
              <span aria-hidden className="text-muted">
                &rsaquo;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

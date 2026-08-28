import Link from "next/link";
import type { CategoryLink } from "@/lib/data/menu";

// Ordered category list for a venue landing (DESIGN.md flow: landing → category
// page). Order comes from data (per-venue), not code (AGENTS.md 10).
export function CategoryNav({
  venueSlug,
  categories,
}: {
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
              href={`/${venueSlug}/${c.slug}`}
              className="type-heading flex items-center justify-between py-3 tracking-[0.6em] text-foreground transition-colors hover:text-muted"
            >
              <span className="flex flex-col">
                <span className="text-sm">{c.name}</span>
                {/* lang=en so the EN line uppercases with dotless I. */}
                {c.nameAlt && (
                  <span lang="en" className="text-[0.625rem] text-muted">
                    {c.nameAlt}
                  </span>
                )}
              </span>
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

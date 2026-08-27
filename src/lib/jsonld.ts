import type { MenuCategoryView } from "@/lib/data/menu";

// schema.org Restaurant + Menu structured data for SEO rich results. Invisible to
// users; only consumed by search engines. Prices are TRY (currently DEMO until the
// real list lands). Rendered as a <script type="application/ld+json"> data block —
// NOT executable JS, so it is exempt from script-src CSP and needs no nonce, and it
// uses React children (never dangerouslySetInnerHTML) so script-breaking sequences
// are auto-escaped (SECURITY.md §4).
export function buildMenuJsonLd(venueName: string, menu: MenuCategoryView[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: venueName,
    hasMenu: {
      "@type": "Menu",
      inLanguage: "tr",
      hasMenuSection: menu
        .filter((c) => c.items.length > 0)
        .map((c) => ({
          "@type": "MenuSection",
          name: c.name,
          hasMenuItem: c.items.map((item) => {
            const offers =
              item.prices.length > 0
                ? item.prices.map((po) => ({
                    "@type": "Offer",
                    name: po.label,
                    price: String(po.amount),
                    priceCurrency: "TRY",
                  }))
                : item.price != null
                  ? {
                      "@type": "Offer",
                      price: String(item.price),
                      priceCurrency: "TRY",
                    }
                  : undefined;
            return {
              "@type": "MenuItem",
              name: item.title,
              ...(item.description ? { description: item.description } : {}),
              ...(offers ? { offers } : {}),
            };
          }),
        })),
    },
  };
}

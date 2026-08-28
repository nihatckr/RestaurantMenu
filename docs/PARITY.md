# Presentation Parity vs Legacy (Terrace/Garden)

How the new menu's **appearance** compares to the legacy apps, and why some
differences are inherent. Behavioral parity (what the menu does per venue) is
covered by tests + `LEGACY_AUDIT.md`; this file is about **visual/HTML/CSS**
fidelity. Evidence: `TerraceMenu/src/components/MenuCard*`.

> Guiding principle: we reproduce the legacy **intent and behavior**, not its
> markup. A pixel-for-pixel copy is neither achievable nor a goal (see "Inherent
> HTML/CSS differences").

## Inherent HTML/CSS differences (cannot be identical, by design)
The legacy apps and this rewrite render **different HTML and CSS** because the
technology is different — so visual differences exist even where the design
intent is the same:
- **Styling engine:** legacy used **styled-components** (runtime CSS-in-JS,
  hashed class names, inline `!important`); we use **Tailwind** utility classes.
  Class names, the cascade, and specificity all differ.
- **DOM structure:** legacy hand-rolled nested `div`s per card; our components
  emit a different (leaner) DOM tree with different wrappers.
- **Layout units:** legacy hard-coded a **fixed 390px** frame with px sizes; we
  use a **responsive** rem/breakpoint scale — so spacing/sizes differ across
  screen widths by design.
- **Rendering model:** legacy was a client SPA (Apollo); we are Server
  Components + PPR streaming, so the HTML the browser receives is structured
  differently (Suspense boundaries, streamed payloads).
- **No animation library:** legacy used `framer-motion` (nav stagger, hover
  scale); we ship none.
- **Fonts/metrics:** same `MonoTRegular` + Inter, but `next/font` subsetting and
  `font-display: swap` can render metrics slightly differently.

These are accepted trade-offs of the rewrite, not defects.

## Reproduced (behavior + close visual intent)
- Landing → single-scroll category page (chosen category first).
- Per-venue visibility (category **and** item), ordering, wordmark.
- Bilingual TR + EN display.
- Food/cocktail image cards (image or pink placeholder), 3-col-ish grid.
- Drink colour chips (`color` field) on imageless drink rows.
- Beer serving measure (`cl`), wine glass/bottle, spirit multi-measure pricing.
- Featured full-width items (legacy featured the first two breakfast spreads).
- Brand: Mono wordmark, MonoTRegular font, pink missing-image placeholder.

## Remaining known differences
| Item | Status | Note |
|---|---|---|
| Rich item descriptions / subtitle (TR+EN) | **Data gap** | Legacy CMS had per-item descriptions; our seed has names only. Fills with real menu data (U5). |
| Wine `DLC` badge | **UNKNOWN** | Legacy showed a "DLC" badge from a `dlc` boolean whose meaning is undocumented; not modelled. Do not invent (AGENTS 5–6). |
| Exact spacing/typography px | **Intentional** | Responsive scale, not the fixed 390px px values. |
| Animations | **Intentional** | No motion library. |
| Bottom brand wordmark on every page | **Replaced** | We show the legal price footer (`COMPLIANCE.md`) instead. |

## How to close the remaining gaps
- **Descriptions/subtitle:** add them per product in the seed (translations) once
  real content is available; the cards already render `description`/`subtitle`
  where present.
- **DLC:** confirm what `dlc` means with the business, then model + render it.

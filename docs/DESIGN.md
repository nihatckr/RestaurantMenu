# Design Spec — RestaurantMenu

> Port the legacy **brand** (font, wordmarks, type scale, greys,
> placeholder-on-missing-image) into Tailwind — **not** the legacy component
> code. Replace the fixed 390px phone frame with a responsive, mobile-first
> layout. Source of tokens: legacy `src/styles/theme.js`.

---

## Brand assets (reuse as-is)
- **Fonts:** `MonoTRegular` (`.woff`/`.ttf`) = brand display font ("Mono").
  `Inter` = body/description font. Both from legacy `assets/fonts` + theme.
- **Wordmarks/SVG:** `mono.svg`, `mono-terrace.svg` (per-venue sub-wordmark),
  `turkish-lira-2.svg` (currency mark, if used).
- **Reference photography:** ~80 categorized product photos in legacy `assets/png`
  — usable as design reference / seed imagery.

## Design tokens (from legacy `theme.js` → Tailwind config)
Colors:
- `text-primary` `#000000`, `text-muted` `#727272`, `bg` `#FFFFFF`.
- `placeholder` `#F48787` at **20% opacity** (missing-image box).

Type scale (font / weight / size / letter-spacing):
| Token | Font | Wt | Size | LS |
|---|---|---|---|---|
| menuTitleCenter | Mono | 300 | 16px | 2px |
| menuSubtitleCenter | Mono | 300 | 10px | 2px |
| menuTitle | Mono | 400 | 12px | 10px |
| headingTitle | Mono | 300 | 12px | 2px |
| headingSubTitle | Mono | 300 | 12px | 2px |
| navHeadingTitle | Mono | 400 | 10px | 6px |
| navHeadingSubTitle | Mono | 400 | 10px | 6px |
| itemTitle | Inter | 700 | 8px | — |
| itemSubtitle | Inter | 700 | 8px | — |
| price | Mono | 400 | 8px | −4px (right-aligned) |
| cl / measure | Mono | 300 | 6px | — |
| desc | Inter | 400 | 6px | — |

> Legacy sizes are tuned for a **fixed 390px** frame. Re-express as a **fluid,
> responsive** scale (rem + breakpoints); keep the *relationships*, not the
> literal px, so it reads well phone→desktop.

## Layout & responsiveness
- **Mobile-first**, fluid width. No fixed `390px`, no `!important` hacks.
- Breakpoints: base (phone), `md` (tablet), `lg` (desktop). Menu is primarily a
  phone/QR surface — optimize that first, scale up gracefully.
- Page structure per venue: **venue wordmark → category nav (landing)** and
  **single-scroll category page** (chosen category first, then the rest) — the
  evidenced flow (PR7).

## Component inventory (collapse legacy ~18 → a small set)
- `VenueHeader` (wordmark + language switcher).
- `CategoryNav` (ordered category list, PR8).
- `CategorySection` (heading + item grid; one component, config-driven).
- `MenuItemCard` — **one** card that adapts by item shape:
  - *food/plated*: image (or placeholder), title, price, description, subtitle.
  - *simple drink*: color chip, title, measure (cl), price.
  - *multi-measure spirit*: title + multiple price columns (4/8 cl, 35/50/70 cl,
    glass/bottle) driven by present fields — replaces legacy's index heuristics
    with explicit structured fields.
- `ImageWithPlaceholder` (renders the pink placeholder when no image — PR11).
- `Spinner` / `EmptyState` / `ErrorState` (non-leaky, per SECURITY.md).

> Rule: card variants are chosen from **structured item data** (type/fields),
> never from a translated category name string.

## Accessibility (baseline — build in, don't bolt on)
- WCAG AA color contrast (watch `#727272` on white at tiny sizes — bump minimum
  body size above the legacy 6–8px for readability).
- Semantic landmarks/headings; category headings as real `<h*>`.
- All images have meaningful/empty `alt` (decorative → `alt=""`).
- Language switcher and nav are keyboard-operable; visible focus states.
- Respect `prefers-reduced-motion` (legacy used framer-motion stagger; keep
  motion optional/minimal).

## Performance / SEO (guest-facing surface)
- Static/ISR render of menu pages; minimal client JS (Server Components).
- `next/image` with an explicit remote-host **allowlist** (SECURITY.md §1);
  responsive sizes; lazy-load below the fold.
- Per-locale `<html lang>`, titles, and meta; sensible Open Graph (brand image).
- Fast fonts (`font-display: swap`, preloaded `MonoTRegular`).

## As-built system (implemented — 2026-08-28)

The spec above is the intent; this is what shipped. See `JOURNEY.md` §4–5 for the
reasoning.

### Centralized typography (one place)
`src/app/globals.css` defines the design tokens **and** a set of typography roles
used across every component — fonts/casing live here; only size/letter-spacing vary
at the call site:

| Role class | Font (legacy `theme.js`) | Used for |
| --- | --- | --- |
| `.type-heading` | Mono, uppercase | category header title, nav links |
| `.type-subheading` | Mono, uppercase, muted | the TR/EN sub-line under a heading |
| `.type-tag` | Mono, uppercase | hard-drink sub-category (Whisky/Rakı/…) |
| `.type-item` | Inter 700 | product name |
| `.type-price` | Mono | prices/numbers |
| `.type-desc` | Inter, muted | subtitle / description |
| `.type-label` | Mono, uppercase, muted | CL / measure column labels |

**Rule (invariant):** *a thing's Turkish and English text share ONE font* — so a
Mono EN heading has a Mono TR sub-line; Inter product names have Inter alt names.

**Fonts are from legacy `theme.js`, not Figma:** price + cl = **Mono** (the
slashed-zero is the legacy design), title/subtitle/desc = **Inter**, headings =
Mono. Prices render as **plain numbers** — no `₺` (the Mono font has no ₺ glyph;
currency is stated once in the footer) and no thousands separator (`1400`, not
`1.400`). English uppercase uses a dotless I (`lang="en"` + CSS `uppercase`);
Turkish keeps its dotted İ.

### Fluid type scale (the responsive standard)
`html { font-size: clamp(13.5px, 11.9px + 0.45vw, 16px); }` and **all** sizes are
rem-based, so every piece of text scales up/down together at the same ratio
(≈13.5px on a small phone → 16px on desktop). No fixed `px`, no `sm:text-*` jumps.

### Responsive grids (mobile-first, 1/2/3-up)
- Compact drinks (beer/soft/wine): **2 → lg:3**.
- Cocktails (photo tiles): **3 → sm:4 → lg:5**.
- Food photos: **2 → sm:3 → lg:4**; desserts/breakfast: **2** (per-category
  `Category.columns` override).
- **Hard-drinks price table:** ONE shared CSS grid (header + all rows via React
  `Fragment`), a column per measure, so CL labels align above prices and a missing
  measure leaves an empty cell that holds its column. GLASS/BOTTLE groups separated
  by a gap column.

### Tokens correction
- Missing-image placeholder box = **`#ffd4d2`** (`--placeholder`, the Figma card
  pink), not `#F48787@20%`. The per-drink colour **chip** behind compact drink
  cards uses `Product.color` at ~20% opacity.
- Full Mono pastel palette (`--mono-red … --mono-purple`) is available as Tailwind
  `bg-mono-*` utilities.

### A11y as-built
- Keyboard `:focus-visible` outline on links/buttons; bigger tap targets.
- No horizontal overflow down to 320px (verified).
- `lang` attributes drive correct TR/EN uppercasing.

## Open questions
- **U-design-1** Exact brand palette beyond the two greys (any accent colors from
  current SaaS)? Confirm during data sourcing.
- **U-design-2** Is a dark theme / rooftop-evening aesthetic wanted (the live
  SaaS is "Mono Terrace rooftop")? Not evidenced; treat as future.

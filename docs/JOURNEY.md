# Journey — how RestaurantMenu was built

A narrative of the decisions behind this app: **what** we chose, **why**, and
**how** we got to the current state. Read `PRODUCT.md` for what the system is,
`ARCHITECTURE.md` for the technical boundaries, and `DESIGN.md` for the visual
system. This file is the story that ties them together.

> Legend: **U#** = an open "unknown/decision" tracked during the build.

---

## 0. Starting point

Mono Hotel Antalya had two legacy menu apps — `TerraceMenu/` and `GardenMenu/` —
Vite + React + Apollo SPAs reading WordPress via WPGraphQL. Only ~5 files differed
between them; the assets were identical. The WordPress GraphQL catalog was **dead**
(the `monomenu*` types were removed) and the live menu had already been rebuilt on
a third-party SaaS whose subscription was inactive — so there was **no live data to
import**.

**Decision:** rebuild from scratch as one app, `RestaurantMenu/`, and treat the two
legacy apps as **READ-ONLY evidence** of the intended behavior (never copy code).

---

## 1. Architecture & data model

**Stack decision:** Next.js 16.3 (App Router, Turbopack, PPR / `cacheComponents`) +
TypeScript + Tailwind v4 + PostgreSQL + Prisma. Explicitly **no** GraphQL/Apollo,
Supabase, Redux/Zustand, or styled-components — the legacy's GraphQL complexity was
unnecessary for a read-mostly menu. Public reads are Server Components → a thin
data-access layer → Prisma → Postgres.

**The core modelling decision — Product vs MenuItem split:** two venues share one
product catalog, so:

- `Product` = venue-independent identity (names, image, drink attributes, tag).
- `MenuItem` = venue/menu-specific facts (price, availability, sortOrder, category,
  the Product↔Menu join).

Price / visibility / ordering **never** live on `Product`; intrinsic dish identity
**never** lives on `MenuItem`. Hierarchy: **Business → Venue → Menu → Category →
MenuItem → Product**. This is what lets a 3rd/4th venue be added with **data only,
no code branches** (a hard rule — no `if (venue === 'terrace')` anywhere).

**Prisma pinned to 6.19.3** — npm `latest` resolved to an unstable v8 RC with a
mismatched client, so the major is pinned. Local DB is a Docker Postgres on port
**5433** (5432 was taken).

---

## 2. The public menu

Built the read path end-to-end: root venue chooser → `/[locale]/[venueSlug]`
landing (brand mark + ordered category list) → `/[locale]/[venueSlug]/[categorySlug]`
single-scroll page (chosen category first, then the rest). Reads use `use cache`
(Cache Components / PPR); unknown slugs are a soft-404.

> The routes gained the `/[locale]` prefix in the i18n rework — see §7. Early on
> the read path lived at `/[venueSlug]` and showed TR+EN together.

Key behaviors, all **data-driven**:

- **Per-venue category visibility & ordering** come from `MenuCategory` rows, not
  code.
- **Language** — initially the legacy TR+EN-together display; later reworked into a
  single-language `/[locale]` switcher (§7).
- **Category slugs are English** (`/tr/terrace/salads`, not `/salatalar`); names are
  localized.
- **Card variant is driven by data, not a category name** — image-presence and
  measure-count decide the layout (see §4), never a hard-coded category string.

**Decisions taken here:** `U11` = two venues (Terrace + Garden). `T11` = **no admin**
— content managed via seed data in the repo. *(Reversed 2026-08-28: the owner will
self-update, so the admin is now being built — Path B, see §9 and `ADMIN_PLAN.md`.)*

---

## 3. Legal, SEO, deploy prep

- **`U12` (TR price-label law / Law 6502):** prices must be VAT-inclusive and
  service/cover charges are prohibited → a site-wide footer states
  "Tüm fiyatlarımıza KDV dâhildir · Servis ücreti alınmaz". `COMPLIANCE.md` records
  the operational duties.
- **SEO:** per-page `generateMetadata`, `sitemap.ts`, `robots.ts`, plus
  **JSON-LD** structured data (schema.org Restaurant/Menu) on the landing —
  rendered as a `<script type="application/ld+json">` **data block** via React
  children (never `dangerouslySetInnerHTML`; exempt from the strict CSP).
- **Security:** a strict **static** CSP (no nonce — a nonce needs dynamic rendering
  and would defeat PPR), 6/6 security headers, `/api/health`.
- **Deploy target = Vercel** + managed Postgres; `vercel-build` runs
  generate → migrate deploy → seed → build so content (repo) ships every deploy.
  See `DEPLOY.md`. Executing the deploy needs the owner's accounts.

---

## 4. Design — from Figma and from the legacy

Two Figma files were analysed: a **Tokens & Resources** file (10-colour pastel
palette, MONO wordmark, multi-venue logo system) and a **Menu** file (393px
mobile-first screens). The palette and brand marks were ported into
`src/app/globals.css` and `public/brand/`.

The card/layout system, all **data-driven** (no category-name switches):

- **Food** (`kind: FOOD` or any item with a photo) → square photo card, name
  (Inter Bold) + price, description below.
- **Cocktails** (`kind: DRINK` + photo) → tall portrait photo tiles.
- **Beers / softs / wines** (imageless drinks) → compact cards; the measure label
  (e.g. "50 CL") sits over the price (legacy beer card).
- **Spirits / hard drinks** (imageless, ≥2 measures, tag-grouped) → an aligned
  **price table** grouped GLASS (small pours) + BOTTLE (bottle sizes), reproducing
  the legacy `MenuItemHardDrinks` two-tier structure.

### The turning point: legacy code is the authority for fonts & layout

Midway, visual fidelity kept drifting because we were guessing from Figma
thumbnails. The user's direction — **"look at our code"** — made the legacy the
source of truth, and reading it settled several things that Figma alone got wrong:

- **Fonts come from `TerraceMenu/src/styles/theme.js`:** price + cl labels =
  **Mono**; product title/subtitle/description = **Inter**; all headings = **Mono**.
  (We had briefly "unified" prices to Inter for consistency — wrong. The Mono
  slashed-zero is the legacy design, not a bug.) The Mono font file is the *same*
  `MonoTRegular` as legacy (single weight).
- **Letter-spacing is per-context** (`theme.js`): category header ≈ 0.125em, nav
  links 0.6em (wide), tag headers 0.125em — not one global value.
- **A general rule the user set:** *a thing's Turkish and English share one font*
  (so the category sub-line is Mono like its EN title, not Inter).
- **Breakfast visibility flip-flopped**, then was settled by the code: legacy
  `Navigation` filters breakfast out of **Terrace** (`id !== 'dGVybToy'`) and shows
  it on **Garden** — the opposite of a verbal instruction, and the user chose to
  follow the code.
- **Nargile / Çerezler don't exist** in the menu (added by mistake, then removed);
  the legacy components confirm the 12-category set.
- **Per-item venue hiding** existed via `mn_show_content` / `mngarden_show_content`
  flags, but the real data died with the backend, so the DEMO examples were removed
  and the mechanism left in place (`MenuItem.available` + an empty hide list).

Centralised styling was introduced so this never drifts again: `globals.css`
defines the design tokens **and** a set of typography roles — `.type-heading`,
`.type-tag`, `.type-item`, `.type-price`, `.type-desc`, `.type-label` — used across
every component. Fonts and casing live in these; only letter-spacing/size vary at
the call site.

---

## 5. Mobile-first & the responsive standard

Real-device problems surfaced (the tooling browser wouldn't shrink below ~640px, so
issues were measured with JS and reproduced from the user's screenshots on a
narrowed desktop browser / a separate `next dev`):

- **Hard-drinks prices shifted when a measure was missing.** Root cause: each
  product row was its *own* CSS grid, so `auto` columns sized per-row and
  slash-joined groups shifted. **Fix:** one shared grid (header + all rows via React
  `Fragment`) with a column per measure — a missing measure leaves an empty cell
  that **holds its column**, so everything stays aligned (verified: Single Malt's
  bottle price aligns in the 70 CL column though it has no 35/50 CL).
- **Grids are mobile-first responsive:** compact drinks 2→3 up, cocktails 3→4→5,
  food 2→3→4, desserts/breakfast 2. (1-up was too sparse; the old 3-up compact
  cards overlapped on phones.)
- **Fluid typography standard** — the one rule the user asked for
  ("büyümeli küçülmeli aynı oranda"): the root font-size is
  `clamp(13.5px, 11.9px + 0.45vw, 16px)`, and **all** sizes are rem-based, so every
  piece of text scales up/down together. No fixed `px`, no `sm:text-*` jumps.
- **A11y/mobile polish:** keyboard focus-visible rings, bigger tap targets, no
  horizontal overflow down to 320px.

---

## 6. Cross-cutting principles (the "how we decided")

1. **Legacy code > Figma > memory.** For behavior and fonts, the legacy source is
   authoritative; Figma is a design reference; verbal instructions are checked
   against the code.
2. **Never invent menu data.** Unknown prices/products stay UNKNOWN and are flagged
   DEMO — real values come from the owner (`U5`). This rule was learned the hard way
   after invented drink names had to be removed.
3. **Data-driven, not name-driven.** Venue behavior, category visibility/order,
   grid columns, and card variants all come from data — never `if (venue/category
   === …)`.
4. **Central over scattered.** Colours, typography roles, and the fluid scale live
   in one place (`globals.css`) so they stay consistent.
5. **Verify, then commit.** Every change runs typecheck + lint + tests (+ a real
   render check) before a clean, single-purpose commit.

---

## 7. Making it multilingual (the `/[locale]` switcher)

The public menu first reproduced the legacy **TR+EN-together** display. When the
owner asked for a language selector we briefly built an RU on-demand toggle (RU
lines hidden in the HTML, revealed by CSS), then — after confirming the intent — 
replaced it with a **real single-language switcher**: the menu renders in **one
language at a time**, chosen by the first route segment (`/tr`, `/en`, `/ru`).

- **Routing:** every page moved under `src/app/[locale]/…`; `[locale]/layout.tsx`
  is the root layout and sets `<html lang={locale}>`. `/` redirects to `/tr`;
  unsupported locales `notFound()`. Each locale is its own static route (the `use
  cache` key includes the locale), and `generateStaticParams` prerenders
  locales × venues × categories.
- **One switcher, no branches:** `LanguageSwitcher` swaps the locale segment with
  plain `<Link>`s; adding a 4th language is data + `LOCALES`, no code branch.
- **Two text sources:** DB product/category text via `translations.ts` (single
  fill-in file, tr required, en/ru fall back to tr); the app's own static strings
  (footer, 404/error/empty, metadata) via a small `messages.ts` catalog.
- **Cyrillic gotcha:** the brand `MonoTRegular` font has no Cyrillic glyphs, so on
  `/ru` the brand-font text roles fall back to **Inter** (with the `cyrillic`
  subset) to keep sizing consistent; prices/labels stay Mono (Latin).

Coverage today: categories fully tr/en/ru; most product titles are tr/en, so `/ru`
falls back to Turkish until the owner fills `translations.ts` (`U5`). Full details
in `I18N.md`.

## 8. Where things stand

**Done:** foundation, DB model, public menu (venues/categories/single-scroll/
per-venue visibility+ordering), **`/[locale]` language switcher (tr/en/ru)** with
localized UI chrome, legal footer, SEO + JSON-LD, security headers, Figma + legacy
visual fidelity (fonts, letter-spacing, card/table layouts), mobile-first responsive
grids + fluid typography, PWA (installable manifest + icons), a11y polish, Vitest
unit+integration tests, Playwright e2e, CI.

**Pending (needs the owner):**

- **Real content (`U5`)** — food/drink prices, spirit bottle sizes (35/50/70 CL),
  soft-drink serving CL, and **EN/RU translations + descriptions**. Everything
  currently shown is DEMO; the structure is ready. Prices go in `prices.ts`, all
  localized text in `translations.ts`.
- **Execute the deploy** (`DEPLOY.md`) — needs Vercel + managed-Postgres + domain
  accounts.
- **Alcohol/allergen legal copy** where applicable (`U12` / `COMPLIANCE.md`).

## 9. Deciding to build the admin (Path B, 2026-08-28)

A design review of the architecture surfaced one real tension: we'd built a
relational DB **and** decided **no admin** (T11) — paying the DB's cost while the
owner still couldn't self-update, and the seed being the content source meant every
change was a code edit + redeploy. Presented two coherent paths: **A** (drop the DB,
render statically from the data files) or **B** (keep the DB, build the admin). The
owner confirmed they'll maintain the menu themselves → **Path B**.

Consequences (full design in `ADMIN_PLAN.md`): the **content source moves seed → DB**
(seed demotes to a dev-only demo importer; deploys go migrate-only so they never wipe
owner edits); the admin is an **inline edit mode** on the live pages (guests still get
the static page) with **modal** create/edit forms; stack is Lucide + zod +
react-hook-form + native `<dialog>` + a small `cn()` (no UI kit, no Redux/Zustand, no
React Query — Server Actions + Next cache cover it); auth is magic-link; images/logos/
favicon upload to blob storage (optimized via sharp), not `public/`. Crucially, the
seed→DB shift adds a new **must-have — data safety** (verified backups, soft-delete/
trash, JSON export, login break-glass) since the seed is no longer the safety net, and
a consolidated **security hardening** checklist (`ADMIN_PLAN.md` §4b).

For the task-by-task record see `TASKS.md`; the full admin design is `ADMIN_PLAN.md`;
every request→decision→approval is logged in `DECISIONS.md`; HTML/CSS-inherent
differences from the legacy are in `PARITY.md`.

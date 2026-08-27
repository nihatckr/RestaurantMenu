# Task Plan — RestaurantMenu

Small, ordered tasks. **No implementation yet** — this is the plan. Order is
adjusted to the audit: the legacy proved a **shared catalog + per-venue
visibility/order** model and **data-driven venues**, so those constraints are
front-loaded (schema, seed, dynamic venue route) and admin/auth is deferred and
gated on a real decision.

Each task: **Objective / Scope / Dependencies / Acceptance criteria.**

Legend for cross-refs: PR# = requirement in `PRODUCT.md`; U# / R# = unknown /
risk in `LEGACY_AUDIT.md`; SEC = control group in `SECURITY.md`.

**Security is cross-cutting, not one late task.** Each stage carries the
`SECURITY.md` controls mapped to it; those controls are part of that task's
acceptance criteria (see the "Mapping to TASKS.md" table in `SECURITY.md`).

---

### T1 — Foundation — ✅ DONE (2026-08-27)
- **Result:** Next.js 16.3.3 + React 19.2.8 scaffolded in `RestaurantMenu/`
  (App Router, TS, Tailwind v4, Turbopack). `cacheComponents` enabled; brand font
  `MonoTRegular` (+ Inter) via `next/font`; wordmark SVGs in `public/brand`; brand
  tokens in `globals.css`; base `layout/loading/not-found/error.tsx` + placeholder
  page; `next/image` `remotePatterns` allowlist (empty); baseline security headers
  in `next.config.ts`; Vitest set up (`format.ts` + test); CI workflow at
  `.github/workflows/ci.yml`; project `AGENTS.md`/`CLAUDE.md` reconciled with the
  Next.js managed block. Gates green: **typecheck ✓ · lint ✓ · test 2/2 ✓ ·
  build ✓ (static)**; runtime verified (200 + headers + 404).
- **Objective:** Bootstrap the Next.js App Router + TypeScript + Tailwind project
  with lint/typecheck/test wired up.
- **Scope:** scaffold **Next.js 16.3** via `create-next-app` (App Router, TS,
  Tailwind, Turbopack); keep the auto-generated `AGENTS.md`/`CLAUDE.md` managed
  block, project rules **outside** the markers (see AGENTS.md note); enable
  **`cacheComponents`/PPR**; TS + Tailwind config (seed brand tokens from legacy
  `theme.js`), ESLint, test runner, `typecheck`/`lint`/`test` scripts, base
  `layout/loading/not-found/error.tsx`, `next/font` for `MonoTRegular` + Inter,
  port brand assets (`mono`/`mono-terrace` SVGs, placeholder styles). No domain
  code.
- **Agent tooling (optional but recommended):** enable the Next.js MCP server
  (`/_next/mcp`) + `agent-browser` for the verify loop; install Next.js
  `next-dev-loop` and Prisma `prisma/skills` so agents use version-correct
  patterns (ARCHITECTURE → Agent/dev tooling).
- **Dependencies:** none.
- **Security (SEC §1/§4):** security headers + baseline CSP set; `.env*`
  git-ignored; dependency audit wired into CI; non-leaky error boundary.
- **Acceptance:** `dev`, `build`, `typecheck`, `lint`, `test` all run clean on an
  empty app; brand font + wordmarks render on a placeholder page; security
  headers present in responses and CI audit runs.

### T2 — Database model — ✅ DONE (2026-08-27)
- **Result:** Prisma **6.19.3** (pinned; avoided the v8 RC) on local Docker
  Postgres (port 5433). `schema.prisma` models Business, Venue, Menu, Category
  (+CategoryTranslation), Product (+ProductTranslation), MenuCategory, MenuItem —
  Product/MenuItem split intact, `@@unique([menuId, productId])` /
  `([productId, locale])` etc., i18n tr/en/ru. Migration `init` applied; Prisma
  client singleton (`src/lib/db.ts`); data-access (`src/lib/data/menu.ts`,
  server-only); idempotent seed (`prisma/seed.ts`) → **2 venues, 9 categories,
  7 products, 14 menu items**. Verified from DB: Terrace hides Breakfast + drink
  order Beer→Wines; Garden shows Breakfast + Wines→Beer — **all data-driven, no
  venue code**. Decision U11 = two venues. Gates green (typecheck/lint/test/build).
- **Objective:** Prisma schema for `Business`, `Venue`, `Menu`, `Category`,
  `Product`, `MenuItem` per `PRODUCT.md`.
- **Scope:** models + relations + migration. `Venue`/`Category` have stable
  slugs; `Category`/`MenuItem` have explicit `sortOrder`; `MenuItem` holds
  `price`, `available`, `categoryId`, and the `(menuId, productId)` join;
  `Product` holds venue-independent fields incl. structured drink attributes
  (PR3–PR6, U1, U4). No hard-coded venue values.
- **Dependencies:** T1; resolves **A1, A4, A5** first.
- **Acceptance:** migration applies to a local Postgres; schema review confirms
  Product/MenuItem split (AGENTS rule 12) and no venue hard-coding; `typecheck`
  passes.

### T3 — Data-access layer
- **Objective:** Thin typed functions over Prisma (`getVenueBySlug`,
  `getMenuForVenue`, `listCategoriesForVenue`, etc.).
- **Scope:** server-only module(s); no repository/DI ceremony; no `prisma.*` in
  components.
- **Dependencies:** T2.
- **Acceptance:** functions typed and unit-testable; a smoke test reads seeded
  data; `typecheck`/`lint` pass.

### T4 — Seed data
- **Objective:** Deterministic seed: one Business, Terrace + Garden venues, the
  legacy category set, a representative set of Products, and per-venue MenuItems
  reproducing the evidenced differences (Breakfast hidden on Terrace; drink
  ordering; soft-drink subsets) — PR2–PR8.
- **Scope:** seed script + brand/reference imagery; encode visibility/order as
  data, not code.
- **Dependencies:** T2, T3; depends on resolving **U5** (source of real content).
- **Acceptance:** `prisma db seed` produces two venues whose menus differ only by
  data; querying Terrace excludes Breakfast, Garden includes it, with no
  venue-name branching anywhere.

### T5 — Dynamic venue route — ✅ DONE (2026-08-27)
- **Result:** `/[venueSlug]` resolves a Venue via `getVenueBySlug`;
  `generateStaticParams` prerenders known venues (terrace/garden). Unknown slugs
  render the `notFound()` boundary — the Cache Components pattern (dynamicParams
  is removed under cacheComponents; params passed into `<Suspense>` and awaited
  inside). Note: PPR flushes the static shell first, so an unknown slug returns
  the not-found **body** with HTTP 200 (documented PPR behavior), not a hard 404.
  Root `/` is a venue chooser. Reads are `use cache`; venue identity is data, no
  code branch. Gates green + runtime verified.
- **Objective:** `/[venueSlug]` resolves a Venue from data (404 on unknown).
- **Scope:** dynamic segment, venue lookup via data-access, not-found handling;
  proves N-venue support (a seeded 3rd venue would work with zero code change).
- **Dependencies:** T3, T4.
- **Acceptance:** `/terrace` and `/garden` render distinct venue landings from
  the same code; an unknown slug 404s; AGENTS rule 10 upheld.

### T6 — Public menu (landing) — ✅ DONE (2026-08-27)
- **Result:** Server-Component landing renders the venue wordmark
  (`VenueHeader`) + ordered, localized (tr) category list (`CategoryNav`) via
  `listVenueCategories`. Order + visibility come from `MenuCategory` data:
  verified Terrace hides Breakfast and shows Beer→Wines, Garden shows Breakfast
  and Wines→Beer. Category links point at `/[venueSlug]/[categorySlug]` (target
  page is T7). Static/PPR; minimal client JS. Gates green + runtime verified.
- **Objective:** Server-Component landing: venue wordmark + category list
  (PR7, PR10), ordered per venue.
- **Scope:** category navigation to category view; ordering from data.
- **Dependencies:** T5.
- **Acceptance:** landing lists that venue's categories in seeded order; links
  navigate to category view; server-rendered, minimal client JS.

### T7 — Categories & single-scroll menu page — ✅ DONE (2026-08-27)
- **Result:** `/[venueSlug]/[categorySlug]` renders the chosen category first,
  then the rest on one scroll (PR7), via `getVenueMenu` (visible categories
  ordered, available items grouped by category, localized, Decimal→number). Only
  visible categories exist, so hidden ones (Breakfast on Terrace) 404 and never
  appear. Verified: `/terrace/salads` → Salatalar first, no Kahvaltı;
  `/terrace/breakfast` → not-found; `/garden/breakfast` → Kahvaltı first. All 27
  (venue,category) pages prerender. Gates green.
- **Objective:** Category page rendering the chosen category first, then the rest
  on one scroll (PR7), driven by stable category slugs (not display text).
- **Scope:** `/[venueSlug]/[categorySlug]`; category ordering per venue (PR8);
  respects MenuItem availability (PR4).
- **Dependencies:** T6.
- **Acceptance:** selecting a category shows it first then remaining categories;
  hidden items/categories per venue do not appear; no `description`-string
  switching.

### T8 — Product presentation — ◐ MOSTLY DONE (2026-08-27)
- **Result:** One `MenuItemCard` adapts by `kind` — food shows
  image/placeholder + title + TRY price + bilingual copy; drinks render compact
  title/tag/price rows. `ImageWithPlaceholder` shows the brand placeholder when
  no image (PR11). `CategorySection` grids food / single-columns drinks.
  **Deferred:** multi-measure spirit pricing (4/8cl, bottle/glass columns) — the
  legacy Hard-Drinks complexity — pending field semantics (U4) and a real data
  source; current `MenuItem.price` is a single value.
- **Objective:** Product/MenuItem card rendering with bilingual text, price,
  image + placeholder, and structured drink attributes (PR6, PR9, PR11).
- **Scope:** a small set of presentation components covering food and drink
  layouts (collapse the legacy ~18-component duplication); placeholder on missing
  image.
- **Dependencies:** T7; needs **U4** (drink field meanings) resolved for full
  drink layout.
- **Acceptance:** food and drink items render correctly incl. multi-measure drink
  pricing; missing image shows placeholder; both languages shown together.

### T9 — Responsive behavior
- **Objective:** Fluid, mobile-first layout (replace legacy fixed 390px frame).
- **Scope:** Tailwind responsive layout across landing, category, cards.
- **Dependencies:** T6–T8.
- **Acceptance:** usable from small phones to desktop; no fixed-width or
  `!important` hacks; visual parity with legacy intent on a phone width.

### T10 — Legacy parity verification
- **Objective:** Confirm the new venues match evidenced legacy behavior.
- **Scope:** checklist/tests: Terrace hides Breakfast, Garden shows it; drink
  ordering per venue; soft-drink subsets; shared catalog; bilingual display
  (PR2–PR9, R3).
- **Dependencies:** T8, T9.
- **Acceptance:** documented parity check passes; deviations are intentional and
  recorded.

### T11 — Admin need assessment (decision gate)
- **Objective:** Decide whether an admin/authoring UI is in scope now, or seed
  data suffices for launch (A3).
- **Scope:** short written decision; if "no", stop here for content management.
- **Dependencies:** T10.
- **Acceptance:** explicit go/no-go recorded; downstream tasks T12–T14 only
  proceed if "go".

### T12 — Auth (only if T11 = go)
- **Objective:** Admin-only authentication via Auth.js (ARCHITECTURE).
- **Scope:** admin login; no guest auth; protect admin routes only.
- **Dependencies:** T11 = go.
- **Acceptance:** admin routes require auth; public menu unaffected; secrets via
  env.

### T13 — Product management (only if T11 = go)
- **Objective:** CRUD for Business-level Products via Server Actions.
- **Scope:** create/edit/delete Products (venue-independent fields only).
- **Dependencies:** T12.
- **Acceptance:** Product edits reflect across venues; write path is Server
  Action → data-access → Prisma; AGENTS rule 12 upheld.

### T14 — Menu assignment (only if T11 = go)
- **Objective:** Manage MenuItems: assign Products to a venue's menu/category,
  set price, availability, order.
- **Scope:** per-venue MenuItem management; the concrete UI for PR4/PR8.
- **Dependencies:** T13.
- **Acceptance:** a Product can be shown in one venue and hidden in another,
  reordered, and (if A1 confirmed) priced per venue — all without code changes.

### T15 — Tests
- **Objective:** Meaningful automated coverage of data-access, visibility/order
  logic, and rendering.
- **Scope:** unit tests for data-access + per-venue filtering; component/render
  tests for cards and single-scroll page. (Run continuously per AGENTS rule 9;
  this task ensures a real suite exists.)
- **Dependencies:** parallel with T3–T8; finalized here.
- **Acceptance:** suite covers venue-visibility and Product/MenuItem split;
  green in CI.

### T16 — Production readiness
- **Objective:** Ship-ready build & deploy.
- **Scope:** env/secret config (`DATABASE_URL`, Auth secrets if used),
  migrations in deploy, error/not-found pages, performance pass, remove dead
  scaffolding.
- **Dependencies:** T10 (and T12–T14 if built).
- **Security (SEC §1–§5):** verify security headers + CSP + `next/image` host
  allowlist; run dependency + secret scan; confirm least-privilege DB role and
  env-only secrets; if admin built, penetration smoke-test authN/authZ; make the
  analytics/consent (privacy) decision explicitly.
- **Acceptance:** production build passes typecheck/lint/tests; documented deploy;
  no legacy dependencies or endpoints referenced; `SECURITY.md` Definition of
  Done satisfied.

---

### Cross-cutting specs → which tasks they bind
- **`I18N.md`** → **T2** (translation tables; language-neutral vs translatable
  split) and **T6–T8** (per-locale render + data-driven language switcher).
- **`DESIGN.md`** → **T1** (tokens/fonts), **T7–T8** (card variants, a11y),
  **T9** (responsive).
- **Cache Components / instant nav** → **T7–T9** may use the
  `next-cache-components-adoption` / `-optimizer` skills to grow the static shell
  and add `instant()` regression tests (folds into **T15**).
- **`DATA_SOURCING.md`** → **T4** (import pipeline + venue count) and **T16**
  (domain cutover from the SaaS).
- **`OPS.md`** → **T1** (CI/envs) and **T16** (deploy/migrations/backups).
- **`SECURITY.md`** → all stages (see its "Mapping to TASKS.md").

**Blocked-until-answered:** T2 needs A1/A4/A5 **and the i18n model (`I18N.md`)**;
T4 needs U5 **and the venue count U11**; T8 needs U4; T11 is the A3 gate; launch
(T16) needs the alcohol/allergen legal check **U12**. See the "critical
questions" in the handoff summary.

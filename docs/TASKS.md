# Task Plan — RestaurantMenu

> **Status (2026-08-28): public menu is feature-complete on DEMO content.** Done:
> foundation, DB model, public menu (venues / categories / single-scroll /
> per-venue visibility + ordering), **real `/[locale]` language switcher
> (tr/en/ru)** — one language at a time, tr fallback, localized static UI chrome
> (`messages.ts`) + product text source (`translations.ts`), legal footer, SEO +
> JSON-LD, security headers, Figma + **legacy** visual fidelity (fonts from
> `theme.js`, letter-spacing, card/table layouts), mobile-first responsive grids +
> **fluid typography**, PWA (installable), a11y polish, Vitest unit+integration +
> Playwright e2e + CI, and this docs set (see `JOURNEY.md`).
> **Admin ✅ DONE (2026-08-28):** T12–T14 shipped — auth, inline category/product
> CRUD, per-venue visibility + reorder, measure prices, image/logo/favicon uploads
> (Vercel Blob + sharp), a tabbed Settings page, Excel backup export/import,
> trash+restore+**empty**, and an audit log + `noindex` on admin surfaces. **Settings
> extras:** password change, per-venue QR codes, business info (name + footer note +
> hours/phone/Instagram/map), full **venue CRUD** (add/rename/wordmark/reorder/delete),
> default-password warning. **Menu enrichments (group A):** per-language description +
> calories + diet/allergen badges on the card. **Analytics (group B):** PII-free
> menu-open counts (`PageView` + `/api/track` beacon) in Settings → Analitik.
> The owner self-updates the menu; source of truth is DB←seed. 37 Playwright e2e
> cover the human flows. See **`ADMIN_PLAN.md`** / **`DECISIONS.md`** (B.1–B.37) and
> **`YAYIN_ONCESI.md`** (owner pre-launch checklist).
> **Pending owner:** real prices (`prices.ts`) + EN/RU translations & descriptions
> (`translations.ts`) — `U5` / `DEMO_MENU.md`, and executing the deploy
> (`DEPLOY.md`).

The plan below is the original ordered breakdown (kept for reference). Order is
adjusted to the audit: the legacy proved a **shared catalog + per-venue
visibility/order** model and **data-driven venues**, so those constraints are
front-loaded (schema, seed, dynamic venue route). Admin/auth was originally deferred
and gated on a decision — that gate is now **GO** (Path B, 2026-08-28; T11 below).

> **Note (2026-08-28):** the per-task text below predates the i18n rework. Two
> things changed since: routes are now locale-prefixed (`/[locale]/[venueSlug]/…`,
> not `/[venueSlug]/…`), and the menu renders **one language at a time** via the
> language switcher (not "bilingual TR+EN together"). The status banner above and
> `I18N.md` are authoritative; these task entries are kept as the historical record.

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
  **Images wired (2026-08-27):** 25 real food photos ported from legacy assets to
  `public/products/<slug>`, set via `Product.image` in the seed; `next/image`
  optimizes them (local, no remote allowlist). After a re-seed, a clean local
  build is needed (`use cache` persists in `.next`); prod builds start clean.
  **Multi-measure pricing DONE (2026-08-27, U4):** added `MenuItemPrice` child
  table (labelled measures, `@@unique([menuItemId, label])`); multi-measure items
  (spirits by cl, wine glass/bottle) leave `MenuItem.price` null and carry
  `prices[]`. Card renders the labelled measures; simple items keep a single
  price. Verified: Rakı 5 CL / Şişe, Viski 4 CL / 8 CL, wines Kadeh / Şişe.
  DEMO amounts (U5). This closes the largest legacy-parity gap.
- **Objective:** Product/MenuItem card rendering with bilingual text, price,
  image + placeholder, and structured drink attributes (PR6, PR9, PR11).
- **Scope:** a small set of presentation components covering food and drink
  layouts (collapse the legacy ~18-component duplication); placeholder on missing
  image.
- **Dependencies:** T7; needs **U4** (drink field meanings) resolved for full
  drink layout.
- **Acceptance:** food and drink items render correctly incl. multi-measure drink
  pricing; missing image shows placeholder; both languages shown together.

### T9 — Responsive behavior — ✅ DONE (2026-08-27)
- **Result:** Mobile-first, fluid layout (no fixed 390px, no `!important`).
  Category page container `max-w-md → sm:max-w-2xl → lg:max-w-4xl`; food grid
  `grid-cols-2 → sm:3 → lg:4`; drink rows `grid-cols-1 → sm:2`; responsive
  heading sizes. Verified: responsive classes emitted in HTML + build green.
  (Visual screenshot pending — Chrome extension not connected this session.)
- **Objective:** Fluid, mobile-first layout (replace legacy fixed 390px frame).
- **Scope:** Tailwind responsive layout across landing, category, cards.
- **Dependencies:** T6–T8.
- **Acceptance:** usable from small phones to desktop; no fixed-width or
  `!important` hacks; visual parity with legacy intent on a phone width.

### T10 — Legacy parity verification — ✅ DONE (2026-08-27)
- **Result:** All evidenced legacy behaviors reproduced and covered by integration
  tests: shared catalog, per-venue **category** visibility (Terrace hides
  Breakfast), per-venue **item** visibility (Vegan Wrap Garden-only, Bomonti
  Terrace-only — the legacy `*_show_content` flags), per-venue drink ordering,
  single-scroll chosen-first flow, bilingual TR+EN display, multi-measure drink
  pricing, and per-venue wordmark. Divergences are intentional and documented
  (responsive vs fixed 390px; a full locale switcher is a separate feature).
- **Objective:** Confirm the new venues match evidenced legacy behavior.
- **Scope:** checklist/tests: Terrace hides Breakfast, Garden shows it; drink
  ordering per venue; soft-drink subsets; shared catalog; bilingual display
  (PR2–PR9, R3).
- **Dependencies:** T8, T9.
- **Acceptance:** documented parity check passes; deviations are intentional and
  recorded.

### T11 — Admin need assessment — DECIDED no-admin (2026-08-27) → ✅ REVERSED: GO (2026-08-28)
- **Reversal (user, 2026-08-28):** the owner **will** self-update the menu, so the
  admin **is being built** (Path B). This flips the original no-admin call: **T12–T14
  are now IN scope**, and the content source moves seed → DB. The full design lives
  in **`ADMIN_PLAN.md`** (surface, auth, CRUD, data safety, security §4b); this plan's
  T12–T14 below are the high-level tasks.
- **Original decision (2026-08-27, superseded):** admin not needed; content via seed
  (`prisma/seed.ts`). Kept for the record.
- **Acceptance:** go/no-go recorded → **GO**; T12–T14 proceed per `ADMIN_PLAN.md`.

### T12 — Auth (T11 = GO) — ✅ DONE (2026-08-28)
- **Objective:** Admin-only auth. **As built:** `iron-session` + bcrypt, single
  owner, username + password (not Auth.js — one owner, no email/multi-user).
- **Scope:** admin login; no guest auth; protect admin routes only.
- **Dependencies:** T11 = go.
- **Acceptance:** admin routes require auth; public menu unaffected; secrets via
  env.

### T13 — Product management (T11 = GO)
- **Objective:** CRUD for Business-level Products via Server Actions.
- **Scope:** create/edit/delete Products (venue-independent fields only).
- **Dependencies:** T12.
- **Acceptance:** Product edits reflect across venues; write path is Server
  Action → data-access → Prisma; AGENTS rule 12 upheld.

### T14 — Menu assignment (T11 = GO)
- **Objective:** Manage MenuItems: assign Products to a venue's menu/category,
  set price, availability, order.
- **Scope:** per-venue MenuItem management; the concrete UI for PR4/PR8.
- **Dependencies:** T13.
- **Acceptance:** a Product can be shown in one venue and hidden in another,
  reordered, and (if A1 confirmed) priced per venue — all without code changes.

### Admin — execution checklist (Path B, 2026-08-28)

Granular, **dependency-ordered** build steps. Design lives in `ADMIN_PLAN.md`; this is
the tracker. Auth = **single owner password** (`iron-session` + argon2). Run the gates
(typecheck/lint/unit/e2e/build) after every step; commit per step.

> **Compatibility (verified against current code):** the public read path is already
> DB-backed via `src/lib/data/menu.ts` — the `prices.ts`/`translations.ts` files feed
> **only** the seed, not the running app. So the admin is **additive** (writes +
> revalidation); no rewrite of the public pages. Single-password auth needs **no
> User/Session tables** (schema has none — good). Schema changes are **additive
> migrations** only, called out per phase below (`deletedAt`, `Business.logo`,
> `AuditLog`).

**Phase A — Seedless foundation** *(must land first — else deploys wipe edits)* — ✅ DONE
- [x] Make `prisma/seed.ts` **bootstrap-only**: bails out if the DB already has
  content; removed every `deleteMany(… notIn …)` reconcile. *Verified:* re-running on
  the populated DB skips (counts unchanged 2/12/53/106).
- [x] Demote content seed to `npm run seed:demo` (dev-only). *Done:* script added.
- [x] `vercel-build` → **migrate-only** (dropped `db seed`); DEPLOY.md updated.

**Phase B — Cache tagging** — ✅ DONE
- [x] Added `cacheTag(MENU_TAG, venueTag(slug))` to all `use cache` reads in
  `src/lib/data/menu.ts` (tags in one place — `src/lib/cache.ts`).
- [x] `revalidateMenu(venueSlug?)` helper (`revalidateTag(tag, "max")`;
  `updateTag` noted for read-your-own-writes from Server Actions). *Verified:*
  typecheck/lint/17 tests/build green.

**Phase C — Data safety** *(before any write feature goes live)* — ◐ PARTIAL
- [x] **Migration `add_soft_delete`:** `deletedAt DateTime?` on Product & Category +
  filter in the data-access reads. *Verified:* trashing a product/category hides it
  from the menu, restore brings it back; 17 tests green.
- [x] **Vitest `next/cache` stub** (no-op `cacheTag`/`revalidateTag`) so the Phase-B
  tagging doesn't throw outside the Next runtime — fixes the integration suite.
- [x] **Trash + restore UI** (Settings "Çöp kutusu"): soft-deleted categories/
  products are listed and restorable. *Verified e2e:* create → trash → restore →
  back in the public nav.
- [x] **Excel export/import** (`exceljs`, slug-keyed, zod+integrity, upsert) —
  admin-only `/admin/export` download + Settings importer. Import validates the
  whole file first (row errors, no partial writes) and applies as an atomic
  upsert (never deletes). *Verified e2e:* export→import round-trip + invalid-file
  rejection.
- [ ] Verify managed-Postgres **backups/PITR** + test one restore — **owner/ops
  action** (non-codeable; OPS.md).
- [ ] Env break-glass (password reset) — owner/ops action.

**T12 — Auth** — ✅ DONE (first-run setup moved to T13 with venue CRUD)
- [x] Deps `iron-session` + `bcryptjs` (bcrypt over argon2 — no native build).
- [x] **`AdminUser` migration** + `prisma/auth.seed.ts` (`npm run seed:admin`) —
  bcrypt-hashes `ADMIN_PASSWORD` (dev `1234`) into the DB.
- [x] `src/lib/auth.ts`: `getSession`/`isAdmin` (iron-session), `verifyPassword`
  (bcrypt vs DB hash), in-process login throttle. `secure` cookie in prod;
  `AUTH_ALLOW_HTTP=1` for local http.
- [x] `/[locale]/login` (form + server action) + logout + rate-limit. *Verified:*
  right password → logs in + session persists; wrong → "Şifre hatalı"; logout clears.
- [x] **e2e** login/logout (10 e2e); CI seeds the admin (`npm run seed:admin`).

**T13 — Inline CRUD (create-first)** — ✅ DONE (2026-08-28)
- [x] Deps: `clsx`, `tailwind-merge`, `lucide-react`, `zod`. UI primitives: `cn()`,
  `Button`, `Input`/`Textarea`/`Field`, and the `Modal` (native `<dialog>` wrapper:
  focus-trap, ESC, backdrop-click close, body scroll-lock).
- [x] **Category CRUD** (add/edit/delete): `categorySchema` (zod, shared),
  `requireAdmin` + slug auto-gen + data-access (`data/admin.ts`) + server actions
  (`category-actions.ts`, `updateTag` read-your-own-writes), and the inline
  **`CategoryManager`** (admin-only Suspense island on the landing) with modal
  forms + delete-confirm. *Verified e2e:* login → add (appears in nav instantly) →
  delete (gone). 11 e2e green.
- [x] **Product CRUD** (modal: tr/en/ru, category, kind, tag, single price **and**
  labelled measures, image; auto-slug) — inline `ProductRowControls` on each card +
  `AddProductButton` per section (icon in the heading + full button below). Guests
  stay static via the session-gated `MenuSectionsIsland`. *Verified e2e:* add →
  appears → edit → delete; measure-price add; photo upload → card renders it.
- [x] Per-venue **visibility** (eye toggle: `MenuItem.available` /
  `MenuCategory.visible`; admin sees hidden greyed) and **reorder** (up/down arrows,
  shared `reorder()` renumber). *Verified e2e:* visibility round-trip + category reorder.
- [x] zod schema per entity (shared client form + server action).
- [x] Inline Edit/Delete + "＋ Add" controls, admin-session only.
- [x] **Category** add/edit/delete + `revalidateMenu` (inline on the existing list).
- [x] Sticky-header account control (**Settings + Çıkış**) when logged in.

**T14 — Images / logos / favicon + Settings** — ✅ DONE (2026-08-28)
- [x] Blob storage (**Vercel Blob**) + `next.config` `remotePatterns` + CSP `img-src`.
  Dev/e2e **fallback** to `/public/uploads` when no token, so uploads are testable.
- [x] `ImageField` (tap-pick + preview + remove) + server upload action + **sharp**
  optimize (WebP/resize/strip). Product photo wired. *Verified e2e:* real upload → card.
- [x] **Migration `add_business_logo`:** `Business.logo String?`; brand mark now
  data-driven (`getBrandLogo()` with `BRAND.mark` fallback) across chooser/landing/category.
- [x] **Settings page:** brand logo + per-venue wordmark uploads; **favicon**
  generated from the logo via the `/brand-icon` route (sharp → PNG, fallbacks).
- [x] Blob **orphan cleanup** on replace/remove (best-effort `deleteImage`).

**Security + tests (cross-cutting, before go-live)** — ✅ DONE (2026-08-28)
- [x] **Migration `add_audit_log`:** `AuditLog` model; every content mutation writes
  an entry via `audit()`. Settings shows a "Son işlemler" list. *Verified e2e.*
- [x] `ADMIN_PLAN.md` §4b hardening present: authz (`requireAdmin`) on every action,
  zod allow-list, server-mediated + sharp-re-encoded uploads, admin `noindex`
  (login + settings). *(Least-priv DB role remains an owner/ops action.)*
- [x] Admin UI copy in **Turkish** throughout.
- [x] **e2e human flow:** login → add category → add product (price/measures/photo) →
  visibility → reorder → export/import → trash/restore → activity log → logout. 23 e2e green.

### T15 — Tests — ✅ DONE (2026-08-27)
- **Result:** Vitest suite, **13 tests green**. Unit: `pickLocalized` fallback
  (i18n), `formatPriceTRY`. Integration (seeded Postgres): both venues listed &
  ordered, shared catalog (Mono Burger in both), unknown venue → null, and the
  evidenced per-venue rules — **Terrace hides Breakfast / Garden shows it**,
  drink order differs, hidden category has no items, category localization
  (tr/en). `vitest.config.ts` adds the `@/` alias + a `server-only` stub + `.env`
  loader (`test/setup-env.ts`). CI now provisions Postgres + `migrate deploy` +
  `db seed` so integration tests and the DB-backed build run in CI too.
- **Objective:** Meaningful automated coverage of data-access, visibility/order
  logic, and rendering.
- **Scope:** unit tests for data-access + per-venue filtering; component/render
  tests for cards and single-scroll page. (Run continuously per AGENTS rule 9;
  this task ensures a real suite exists.)
- **Dependencies:** parallel with T3–T8; finalized here.
- **Acceptance:** suite covers venue-visibility and Product/MenuItem split;
  green in CI.

### T16 — Production readiness — ◐ READINESS DONE (2026-08-27)
- **Result:** Ship-ready. Strict **static CSP** (no nonce — keeps PPR static;
  documented in SECURITY.md) + full security header set (verified 6/6 at
  runtime). `/api/health` liveness route (JSON), `robots.ts`, `metadataBase`
  (env `NEXT_PUBLIC_SITE_URL`). `db:deploy` script (`prisma migrate deploy`).
  **`DEPLOY.md`** runbook: env vars, first deploy, and the SaaS→our-app domain
  cutover for `menu.monohotelantalya.com`. Gates green (typecheck/lint/test 13/
  test/build). **Pending (needs owner accounts, not codeable):** provision managed
  Postgres, connect host, DNS cutover — see DEPLOY.md. Launch blockers to confirm
  first: real prices (U5), alcohol/allergen legal display (U12).
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
T4 needs U5 **and the venue count U11**; T8 needs U4; T11 (the A3 gate) is now
**GO** → T12–T14 unblocked (Path B); launch
(T16) needs the alcohol/allergen legal check **U12**. See the "critical
questions" in the handoff summary.

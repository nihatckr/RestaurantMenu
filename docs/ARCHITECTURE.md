# Technical Architecture — RestaurantMenu

> Authority: this file defines the **technical boundaries**. `PRODUCT.md` says
> what to build; this says how, and — just as importantly — what **not** to use.
> Prefer the **smallest architecture that satisfies `PRODUCT.md`.**

---

## Chosen stack
- **Next.js (App Router)** — server-rendered public menu, file-system routing.
- **TypeScript** — everywhere; no untyped JS.
- **Tailwind CSS** — styling. (Legacy used styled-components + a theme-token
  object; port the *tokens*/scale, not the library.)
- **PostgreSQL** — the catalog store.
- **Prisma** — typed DB access and schema/migrations.
- **`iron-session` + `bcryptjs`** — admin auth (single owner, username + password;
  shipped Path B). Admin-only, never for guests. (We chose iron-session over Auth.js:
  one owner, no email/multi-user.) `sharp` + `@vercel/blob` for admin image uploads;
  `qrcode` (QR), `exceljs` (backup). All admin-only.

## Explicitly NOT used
Do not introduce any of these, even though some appear in the legacy apps.
Seeing a tool in `TerraceMenu`/`GardenMenu` is **not** a reason to carry it over.
- GraphQL, GraphQL Yoga, Apollo Client, Pothos, GraphQL Code Generator.
- Supabase.
- Redux, Zustand (or any global client state library).
- styled-components (replaced by Tailwind).
- framer-motion, react-icons — only if a concrete need survives design; not by
  default.

Adding anything outside the chosen stack requires the justification step in
`AGENTS.md` (rule 8).

## Read path (public menu) — the default path
```
Next.js Server Component
  → application/data-access function (typed, server-only)
    → Prisma
      → PostgreSQL
```
- The public menu is **read-only** and should be **Server Components** fetching
  directly through a small data-access layer. Render on the server; ship minimal
  client JS.
- Use dynamic segments for locale + venues: `/[locale]/[venueSlug]` (landing) and
  `/[locale]/[venueSlug]/[categorySlug]` (single-scroll page). **Venue is a route
  parameter resolved to a Venue record — never a hard-coded branch.** Locale is the
  first segment (`/tr`, `/en`, `/ru`); `/` redirects to the default (`I18N.md`).

## Write path (only when a mutation is genuinely needed, e.g. admin)
```
Server Action (or Route Handler)
  → application/data-access function
    → Prisma
      → PostgreSQL
```
- Mutations go through Server Actions or Route Handlers, then the same
  data-access layer. No Prisma calls scattered across the component tree.
- **Analytics beacon exception (keeps the public page static):** the venue landing
  must stay statically prerenderable, so it cannot write a page-view on the server.
  Instead a tiny `"use client"` component (`TrackView`) fires a fire-and-forget
  `POST /api/track` on mount; the Route Handler validates the payload (known venue
  slug + supported locale) and inserts a `PageView` via the data-access layer,
  always returning `204`. No PII is sent or stored (no IP, no user agent, no
  cookies). Read side: `getAnalytics()` aggregates counts for the Settings panel.

## Data-access layer — the middle ground
- Keep Prisma calls behind a **thin set of typed functions** (e.g.
  `getVenueBySlug`, `getMenuForVenue`, `listCategories(venueId)`). This is the
  "application/data access" box above.
- **Do not** build heavy repository/service/DI abstractions, interfaces per
  entity, or a CQRS layer. One module of functions per aggregate is enough.
- **Do not** call `prisma.*` directly inside React components/pages. Components
  call the data-access functions.

## Single-source constants (no magic values, DRY)
Shared values live in exactly one module and are imported everywhere — never
duplicated as inline literals:
- `src/lib/i18n.ts` — `LOCALES`, `DEFAULT_LOCALE`, `isLocale`, `localized`
  (the app's supported languages; the DB `Business.locales` mirrors this).
- `src/lib/brand.ts` — `BRAND` (mark asset path, name, chrome colours used outside
  CSS; CSS uses the matching `--foreground`/`--background` tokens).
- `src/lib/site.ts` — `SITE_URL` (metadataBase/sitemap/robots) and `BUILD_FALLBACK`
  (DB-less CI prerender placeholders).
- `src/lib/format.ts` — `CURRENCY`, `formatPriceTRY`.
- `src/lib/messages.ts` — UI-chrome strings; `prisma/data/{prices,translations}.ts`
  — content. Design tokens/typography roles live in `globals.css`.
The seed is data-driven off `Business.locales` (no hard-coded language list); no
`if (venue === …)` or hard-coded slugs in logic (AGENTS.md 10).

## Next.js App Router conventions (per nextjs.org/docs — target **Next.js 16.3**)
- **Version:** build on **Next.js 16.3** (current stable, Aug 2026) with the
  React version it requires; **Turbopack** is the default bundler. Scaffold via
  `create-next-app` (see the AGENTS.md reconciliation note below).
- **Server Components by default;** add `'use client'` only for genuine
  interactivity (language switcher, minor UI state). Data is fetched server-side
  through the data-access layer — never expose DB access to the client.
- **Rendering/caching for a menu (current model):** prefer **Partial
  Prerendering / `cacheComponents`** — a static shell served instantly, with any
  genuinely per-request bit isolated in its **own `<Suspense>` leaf** so one
  dynamic fetch doesn't make the whole page dynamic. Cache catalog reads with
  `use cache` + tags (`cacheTag(MENU_TAG, venueTag(slug))`); admin mutations call
  **`updateTag`** (read-your-own-writes — edits show immediately) so admin edits
  refresh public pages without a redeploy. (Plain `export const revalidate`
  ISR is an acceptable fallback.) No client data-cache library (no SWR/TanStack)
  — Server Components + caching/revalidation only.
- **Images:** `next/image` with **`remotePatterns`** host allowlist (the older
  `images.domains` is deprecated) — `SECURITY.md` §1.
- **Agent / dev tooling (16.3) — use these to satisfy AGENTS rule 9 (verify):**
  - **Next.js MCP server** at `/_next/mcp` — `get_compilation_issues` /
    `compile_route` verify compilation **without a full `next build`**.
  - **`agent-browser`** CLI — DOM/console/network/Web Vitals + React tree +
    pending Suspense boundaries as structured text; use it to confirm the menu's
    **static PPR shell** and that only per-request bits stream.
  - **Browser-log-forwarding** (`logging.browserToTerminal`) + the **dev server
    lock file** are on by default.
  - **Cache Components error-driven fixes:** blocking-prerender errors link to
    agent-readable `/docs/messages/*` pages with canonical fixes; use them when
    adopting PPR.
- **Skills (install as needed, not deps):** Next.js `next-dev-loop`
  (inspect→edit→verify), `next-cache-components-adoption`,
  `next-cache-components-optimizer` (writes `instant()` regression tests),
  `next-partial-prefetching-adoption`; Prisma `prisma/skills`
  (`prisma-client-api`, `prisma-cli`, `prisma-database-setup`,
  `prisma-postgres-setup`) so agents use version-correct Prisma patterns. These
  are agent capabilities, not runtime dependencies.
- **Dynamic segments:** `/[locale]/[venueSlug]/[categorySlug?]`. Use
  `generateStaticParams` to pre-render known venues/categories/locales;
  `dynamicParams` controls fallback vs 404. Unknown slug → `notFound()`.
- **File conventions:** `layout.tsx` (per-locale `<html lang>`), `loading.tsx`
  (Suspense fallback / spinner), `not-found.tsx` (404), `error.tsx` (non-leaky
  error boundary — no stack traces to users, per `SECURITY.md`).
- **Metadata:** use the Metadata API — `generateMetadata` per locale/venue for
  title/description/Open Graph (`DESIGN.md` SEO).
- **Mutations (deferred):** Server Actions for form/simple writes, Route Handlers
  for anything API-like/webhooks; both go through the data-access layer, then
  `revalidate*` the affected paths/tags.
- **Fonts:** `next/font` (local) for `MonoTRegular` + Inter — optimized,
  preloaded, `swap` (`DESIGN.md`).
- **Env vars:** server secrets are plain (`DATABASE_URL`, `AUTH_SECRET`); only
  non-secret, browser-needed values may be `NEXT_PUBLIC_*`. No secret is ever
  `NEXT_PUBLIC` (`SECURITY.md` §3).
- **i18n routing:** `[locale]` segment with `generateStaticParams` over the
  data-supported locales (`I18N.md`), not a hard-coded list.

## Prisma ORM conventions (per prisma.io/docs)
- **Schema-first:** a single `schema.prisma` is the source of truth; the typed
  Prisma Client is generated from it. Model names/relations follow Prisma
  conventions; enforce integrity with `@unique` / `@@unique` (e.g.
  `@@unique([menuId, productId])`, `@@unique([productId, locale])`) and explicit
  relations.
- **Client singleton:** instantiate one `PrismaClient` behind a
  `globalThis` guard so Next.js dev/HMR (and serverless invocations) don't open
  new connections each reload. The data-access layer owns this instance.
- **Migrations:** `prisma migrate dev` locally; `prisma migrate deploy` in the
  pipeline (see `OPS.md`). Forward-only, reviewed.
- **Seeding:** idempotent `prisma db seed` wired via the `prisma.seed` package
  key (see `DATA_SOURCING.md`).
- **Query safety:** use the type-safe query API; **never** `$queryRawUnsafe` /
  string-built SQL — parameterized `$queryRaw` only if raw is unavoidable
  (`SECURITY.md`).

## Data model direction (schema lives in Stage 2, not here)
Mirror `PRODUCT.md`: `Business`, `Venue`, `Menu`, `Category`, `Product`,
`MenuItem`. Guiding constraints:
- `Product` holds venue-independent fields; `MenuItem` holds
  `price`, `available`, `sortOrder`, `categoryId`, and the `(menuId, productId)`
  join. Do not blur the two (see `AGENTS.md` rules 11–12).
- Everything routable has a **stable slug** (venue, category). No behavior keyed
  off free-text display names (legacy's core mistake).
- Sort order is explicit and can differ per venue.
- Preserve drink measure/pricing as **structured fields**, not free text.
- **Per-venue visibility (including scheduling) lives on the join, not the catalog.**
  `MenuCategory` carries `visible` and an optional daily time window
  (`visibleFrom`/`visibleTo`, "HH:MM", Europe/Istanbul); the guest **menu
  navigation** filters by the current time at request time (in the already-dynamic
  `CategoryNavIsland`), so the cached menu readers stay time-agnostic and static.
- **Operational (not part of the shared catalog):** `AdminUser` (single owner),
  `AuditLog` (admin action trail), and `PageView` (PII-free menu-open counts for
  analytics — `venueSlug`, `locale`, `createdAt` only). These sit beside the
  catalog model, never on `Product`/`MenuItem`.

## Rendering / presentation
- Port legacy **design tokens** (type scale, brand greys, the `MonoTRegular`
  font, wordmark SVGs, placeholder-on-missing-image) into Tailwind config +
  static assets. Reuse the bundled brand assets; do **not** reuse legacy
  component code.
- The legacy fixed `390px` phone frame is a QR-screen constraint, not a
  requirement — build **responsive** by default (`PRODUCT.md` browsing flow,
  Stage: responsive).
- Content renders in **one language at a time**, selected by the `/[locale]`
  route segment via a language switcher; missing translations fall back to
  Turkish (`I18N.md`). (Earlier MVP showed TR+EN together — since replaced.)

## Config & environment
- No secrets in the repo. `DATABASE_URL`, `SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`
  via environment. The legacy `VITE_GRAPHQL_URL` and WordPress endpoint are **not**
  used.
- Static assets served by Next; the legacy `.htaccess` SPA rewrite is obsolete.

## Quality gates (every change)
Per `AGENTS.md` rule 9: `typecheck`, `lint`, and the relevant tests must run and
pass after each implementation step. Wire these scripts up in Stage 1
(Foundation).

## Non-goals (architecture)
- No GraphQL API layer of any kind.
- No client-side data store / cache library (Server Components + revalidation).
- No microservices, no external message queue, no realtime.
- No preemptive admin/auth scaffolding before `PRODUCT.md` requires it.

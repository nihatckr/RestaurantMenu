# Admin Plan — owner self-service (Path B)

**Decision (2026-08-28):** the owner will maintain the menu themselves, so we build
an **admin** (auth + CRUD). This resolves the one architectural tension noted in
`DECISIONS.md` (a relational DB with *no* admin). See also `SECURITY.md` §2 — the
write path was always specified; this activates it. Supersedes the earlier
**T11 = no-admin** decision.

This is a **plan**, not yet built. Nothing here ships until its `SECURITY.md`
controls ship with it (AGENTS.md rule 13).

---

## 1. The pivotal change: the DB is the sole content source; start EMPTY

The admin must be a **menu builder**: on an **empty database**, the owner logs in
and **creates everything from scratch** — categories, products, prices,
translations, per-venue visibility/order. **No content seed is required.**

**Required changes:**
- **No content seed on deploy.** The DB is the single source of truth; production
  starts empty and is populated through the admin. `vercel-build` runs **migrations
  only** (no `db seed`). (`DEPLOY.md` update.)
- **Remove the authoritative reconcile** (`deleteMany(... notIn ...)`) — admin-created
  rows must never be deleted by a re-run.
- The existing `prisma/seed.ts` + `data/{prices,translations}.ts` demote to an
  **optional, dev-only demo importer** (`npm run seed:demo`) — handy for local work,
  **never** run in production. Production content is 100% admin-created.
- The only non-content bootstrap is the **first admin + the Business/Venue skeleton**
  — see §3 (First run).

## 2. Surface — inline "edit mode" on the live pages (no separate dashboard)

The admin is **not** a separate `/admin` area — it is an **inline edit mode on the
existing menu pages**, so the owner edits exactly what they see (WYSIWYG). Chosen
for simplicity/ease over a dashboard.

- **Guests:** the current page, unchanged — fully **static**, zero admin JS, no
  controls.
- **Admin (logged in):** the *same* pages render an edit mode — small **Edit / Delete**
  controls next to each item & category, an **"＋ Add product"** under each category
  and **"＋ Add category"** on the page. This variant is **dynamic (not cached)** and
  the admin JS loads **only for the authenticated admin** (session checked on the
  server) — so nothing leaks to guests and the static public cache is untouched.
- **Create & Edit open a modal form** (accessible dialog: focus-trap, ESC/backdrop
  close, `aria-modal`); **Delete asks to confirm** in a small modal. No page
  navigation for routine edits.
- **Two homes, by nature of the data:** per-item **menu content** (categories,
  products, prices, translations, visibility/order) is edited **inline**; **global /
  brand / site settings** (logo, wordmark, **favicon**, venue details) live on a
  small **Settings page** — they're global and rare, so inline doesn't fit. One
  compact page, not a sprawling dashboard.
- **Login / logout:**
  - **Login** is a discreet route (e.g. `/login`) — **not linked anywhere public**;
    the owner bookmarks it. Magic-link flow.
  - Once logged in, the **sticky header** shows a small account control —
    **Settings** + **Logout** (a `LogOut` icon) — visible only to the admin, never
    to guests. Inline edit controls simply appear while logged in (no separate
    "edit mode" toggle in v1).

## 2b. Caching — static public, invalidated on write

Public reads use `use cache` (PPR). For edits to appear without redeploying:
- **Tag** the data-access reads: add `cacheTag("menu", "venue:<slug>", …)` inside
  `src/lib/data/menu.ts` (the `cacheTag` work deliberately skipped earlier as
  YAGNI — the admin is the consumer that justifies it now).
- **Revalidate on mutation:** every admin write (server action) calls
  `revalidateTag(...)` so the guest-facing static pages rebuild on next request.
- The guest render stays fully static/cacheable; only the admin's own view is
  dynamic.

## 3. Auth (T12) + First run (empty database)

- **Library:** **Auth.js v5 (NextAuth)** with the **Prisma adapter** — App-Router
  native, not on the denied-deps list, purpose-built (justified per ARCHITECTURE
  §"dependencies"). Avoids hand-rolling sessions/CSRF.
- **Method (recommended): passwordless email magic-link.** Simplest UX (owner types
  their email, clicks the link — no password to set/store/reset) and it works on an
  **empty DB**. Alternative: single hashed password in env. Decide (**U-admin-1**).
  No public sign-up.
- **First run on an empty DB (seedless):** the allowed admin email is set in env
  (`ADMIN_EMAIL`). On first magic-link login it creates the `User` row (role
  `admin`). If no `Business`/`Venue` exists yet, a tiny **first-run setup** step in
  the admin creates the Business + the first Venue (name + wordmark). From there the
  owner adds categories and products. **No content seed needed at any point.**
- **Model additions:** `User` (+ `role`), `Session`, `VerificationToken` (Auth.js
  adapter tables). No committed credentials — only `ADMIN_EMAIL` + mail-sender creds
  in env.
- **Session:** httpOnly, secure, SameSite cookies; short-lived + rotation.

## 4. Authorization & the write path (SECURITY.md §2)

- **Every mutation is a Server Action / Route Handler that:** (1) resolves the
  session server-side, (2) checks `role === "admin"`, (3) validates input with a
  **zod** schema (no mass assignment — explicit fields only), (4) writes via the
  data-access layer, (5) `revalidateTag`s.
- **Controls:** CSRF (Auth.js built-in for actions/handlers), **rate-limiting** on
  auth + mutations, **audit log** (who changed what, when), secrets only in env,
  **no raw SQL**, non-leaky errors (SECURITY.md §4).
- **No Redis for v1.** Read caching is Next (`use cache`/`cacheTag`); sessions are
  DB/JWT via Auth.js — neither needs it. Rate-limiting starts light (magic-link
  already curbs brute force; a DB counter or Vercel's edge limit if needed). The
  only future justification is **distributed** rate-limiting on serverless → then
  **Upstash Redis** (HTTP, serverless-friendly). No queues/real-time in scope.
- **No separate admin route to secure** — the edit controls + modal forms are
  authenticated **islands** rendered into the existing pages only when a valid admin
  session is present (server-checked). The guest render ships none of it. The mutation
  server actions re-check the session server-side (never trust the client), so
  security doesn't depend on hiding the UI.

## 4b. Security hardening checklist (admin write surface) — SECURITY.md §2

The consolidated "so nobody hacks us" list. All must be present before the admin
goes live.

- **Auth:** magic-link tokens **short-lived + single-use**; `ADMIN_EMAIL` allow-list;
  cookies httpOnly + secure + SameSite; **rate-limit the login/magic-link request**
  (anti email-bomb / user-enumeration → generic responses either way).
- **Authorization:** every mutation re-checks the session + `role === "admin"`
  **server-side**; queries scoped to this business's rows (no IDOR); security never
  relies on hiding the UI.
- **Input & stored XSS:** zod-validate every field with an **explicit allow-list**
  (no mass assignment). Content fields are **plain text** → **React auto-escaping**
  prevents stored XSS; **no rich-text/HTML** rendering; JSON-LD is emitted via React
  children (escaped), never `dangerouslySetInnerHTML`.
- **Uploads:** **server-mediated + authenticated only** (no public bucket write);
  validate MIME + size; **re-encode with `sharp`** (strips EXIF / neutralizes
  polyglots); SVG → PNG/WebP or sanitized; store with the correct content-type;
  storage holds only public images (no secrets).
- **Transport / headers (already shipped):** HTTPS + HSTS, CSP, `X-Frame-Options:
  DENY`, `nosniff`, Referrer-Policy, Permissions-Policy. **Residual:** `script-src
  'unsafe-inline'` is an accepted trade for the static PPR shell; low practical risk
  (no HTML-injection vector) — revisit a nonce if the surface grows.
- **Data / secrets:** Prisma parameterized (**no raw SQL**); **least-privilege DB
  user** (not superuser); secrets only in env (never committed / never in the client
  bundle); admin views `noindex` + excluded from robots/sitemap.
- **Ops:** **audit log** of mutations (who/what/when); non-leaky errors; dependency
  hygiene (`npm audit`, keep Auth.js/adapters current); backups per §6d.

**Further hardening (phase-in / ops — nice-to-have, not launch-blocking):** extra
cross-origin headers (COOP/CORP); enable Vercel's **firewall / edge rate-limit**
(bot/DDoS); **session idle-timeout + "log out everywhere"** (shared restaurant
devices); **monitoring/alerting** (e.g. Sentry — optional dep) + `npm audit`/
Dependabot in CI + alert on repeated failed logins; a **pre-launch security review /
basic pen-test** pass + secrets-rotation policy; **KVKK/privacy** note — minimal PII
(admin email + audit log), and the public menu collects no guest data/analytics.
These are captured so they aren't forgotten; fold them in during build/ops rather
than pre-building them.

## 5. Admin CRUD surface (T13) — build a menu from nothing

Full **create / edit / delete**, so the owner can stand up the whole menu on an
empty DB. Kept simple with sensible defaults (auto-slug, "visible everywhere",
appended order) so the common path is a few taps.

- **Categories — add / edit / delete.** Form: TR/EN/RU name, optional `columns`.
  **Slug auto-generated** from the English (or TR) name, editable, uniqueness-checked
  — the owner never types a slug by hand. Reorder by drag or up/down.
- **Products — add / edit / delete.** Form: TR/EN/RU title (+ optional subtitle/
  description), **category** (picker), kind (food/drink), optional tag, **price**
  (single amount *or* labelled measures like 4 CL / 35 CL / glass-bottle), photo,
  and **which venues show it** (defaults: all venues, available, appended to the
  category). Slug auto-generated + editable.
- **Prices:** edited inline on the product; per-venue only if the owner turns that on
  (model already allows it; default = same everywhere).
- **Per-venue menu:** toggle a category/product **visible** per venue and set
  **order** — still data-driven, never a venue-name branch.
- **Venues:** add / edit (name, wordmark, order) — rarely used; created once at first
  run.

**UX principles (the "easy" bar):** edit **in place** on the live menu — an Edit and
a Delete control next to each item/category, an **"＋ Add product"** under each
category, **"＋ Add category"** on the page. **Add & Edit open a modal form**
(accessible `<dialog>`: focus-trap, ESC/backdrop to close); **Delete confirms** in a
small modal. Mobile-friendly (owner edits from a phone); no jargon ("Name (Turkish)",
"Price", "Show on Terrace"); Save → server action (zod) → `revalidateTag` → live. No
multi-step wizards, no separate dashboard to learn.

## 5b. Admin UI stack (dependencies)

Small, purpose-built additions (justified per ARCHITECTURE §dependencies); none is on
the denied list:

- **Icons — `lucide-react`.** Per-icon, tree-shakeable imports for the inline
  Edit / Delete / ＋Add controls. No icon font or sprite.
- **Validation — `zod`.** ONE schema per entity, **shared** by the client form and
  the server action (which re-validates — the client is never trusted). Single source
  of the shape + rules.
- **Forms — `react-hook-form` + `@hookform/resolvers/zod`.** Chosen over **Formik**:
  lighter, far fewer re-renders, first-class zod integration. Drives the modal
  create/edit forms with inline field errors.
- **Modal — native `<dialog>`** (decided) via ONE thin reusable `<Modal>` wrapper —
  no UI-kit dependency. `showModal()` gives focus-trap (background `inert`), **ESC**,
  and `::backdrop` for free. The wrapper adds the three things native `<dialog>`
  doesn't: (1) sync React `open` ↔ `showModal()`/`close()` and **return focus** to
  the trigger on close, (2) **backdrop-click to close**, (3) **body scroll-lock**
  while open. Enter/exit animation is native CSS (`@starting-style` + `transition` +
  `transition-behavior: allow-discrete`) — consistent with the "no JS motion lib"
  decision and auto-disabled under `prefers-reduced-motion`. Every create/edit/delete
  form renders inside this one component. (Radix Dialog stays the fallback only if
  dialogs later get numerous/complex — not for v1.)

- **Styling & components — Tailwind + our own primitives, no UI kit.** No shadcn/ui
  (it reintroduces Radix — we chose native `<dialog>`) and no DaisyUI (opinionated
  look clashes with the bespoke minimalist brand). Instead: one small **`cn()`**
  helper (**`clsx` + `tailwind-merge`**) for conditional/override-safe classes, plus
  a handful of hand-rolled, brand-consistent primitives — `Button`, `Input`,
  `Textarea`, `Field` (label + error), and the `Modal` wrapper — reused across every
  form (same "central over scattered" principle as the public `.type-*` roles).
  `class-variance-authority` (cva) only **if** button/badge variants multiply — not
  needed for v1. Optional dev-only: `prettier-plugin-tailwindcss` (class sorting).

**State management & data fetching — deliberately NONE.** `Redux`/`Zustand` are on the
**denied-dependency list** (`AGENTS.md` rule 8); a client data-fetch/cache library
(**React Query / TanStack Query**) is **not needed either** — in the App Router +
Server Actions model it duplicates Next's own caching and would pull data fetching to
the client (against the SSR / minimal-JS ethos). What covers it, all built-in:
- **Fetch + cache:** Server Components + `use cache` / `cacheTag`.
- **Refresh after a write:** `revalidateTag` / `revalidatePath`.
- **Form/submit state:** `useActionState` / `useFormStatus`.
- **Optimistic UI:** React 19 `useOptimistic` (no library).
- **Local UI state** (modal open, form fields): `useState` / `useReducer`.

(**TanStack Table** likewise isn't needed — the admin uses simple lists, not heavy
sortable/filterable tables; revisit only if a large management grid ever appears.)

## 6. Images (T14)

- **Not the `public/` folder.** `public/` is **build-time and read-only in
  production** (Vercel/serverless has no writable app FS) — runtime uploads can't go
  there. Uploads go to **object storage (Vercel Blob / S3-compatible)**; the current
  committed `public/products/*` are just the initial demo assets.
- `Product.image` stores the returned **URL**; add the storage host to `next.config`
  image `remotePatterns` (currently empty — SECURITY.md §1 allowlist).
- **Optimized on upload:** re-encode + resize server-side with **`sharp`** (to WebP,
  sane max dimensions, strip metadata) *before* storing — then `next/image` optimizes
  again on delivery. Validate type/size; no arbitrary remote fetch. No client library.
- **Organized by key, not folders:** store under tidy keys (e.g.
  `products/<category>/<slug>-<hash>.webp`, `logos/<venue>/…`) for housekeeping —
  purely cosmetic. The **DB URL is the source of truth**; a product changing category
  does **not** require moving the file (URL is stable), so paths carry no logic.
- **Favicon + PWA icons (included):** generated from the owner's uploaded brand logo
  with `sharp` (favicon + 192/512/maskable/apple-touch — same pipeline as today's
  icons), served via dynamic metadata/icon routes + `manifest.ts` reading the stored
  asset (they stop being static files once owner-managed).
- **UX — one `ImageField` component, no upload library.** Must-have: **tap/click to
  pick** (opens camera/gallery on phones — the owner's likely device) + **live
  preview** + **Replace / Remove**. **Drag-and-drop is an optional desktop
  enhancement** on the *same* field (hand-rolled HTML5 drag events, ~20 lines) — not
  a need, since it's useless on mobile. No `react-dropzone`/`filepond`/`uploadthing`.

### Logo / wordmark upload (included)
The same `ImageField` also uploads **brand logos**, not just product photos:
- **Venue wordmark** (`Venue.wordmark`) — already a data field; just wire the upload
  in the venue edit form.
- **Brand mark** — today it's the `BRAND.mark` **code constant** (`/brand/mono.svg`).
  To let the owner upload it, **promote it to data** (e.g. `Business.logo`, falling
  back to the bundled SVG default). `BRAND.black/white/name` stay constants.
- **SVG security caveat:** logos are often SVG, and SVG can carry scripts →
  uploading raw SVG is an XSS risk (`next/image` keeps `dangerouslyAllowSVG` **off**
  by design). So either accept **PNG/WebP** for uploaded logos, or **sanitize SVG
  server-side** before storing. Default recommendation: **PNG/WebP upload** for
  owner-supplied logos; keep the crafted brand SVG as the bundled fallback.

## 6d. Data safety — the MUST-HAVE the seed→DB shift creates

Until now the **seed was the safety net**: content lived in git and could be
re-seeded anytime. Moving the source of truth to the DB **removes that net** — a lost
DB or an accidental delete would erase the menu with no way to regenerate it. So data
safety is non-negotiable and ships *with* the admin, not after:

- **Automated DB backups — #1.** Use the managed Postgres provider's **PITR / daily
  snapshots**; **verify they're enabled** and test a restore once. (Non-codeable but
  mandatory — belongs in `OPS.md`/`DEPLOY.md`.)
- **Delete safety:** confirm + explain consequences; **soft-delete / trash** for
  products & categories (restore within N days) — or at minimum **block deleting a
  non-empty category**. No silent cascade wipes.
- **Export / import — Excel (`.xlsx`), owner-friendly.** One-click **export the whole
  menu to an `.xlsx` workbook** (sheets: Categories, Products, Translations, Prices,
  per-venue visibility/order) — a human-readable backup the owner can open, bulk-edit,
  and **re-upload to rebuild the DB**. Restores the "content is portable" property we
  gave up by leaving the seed, in a form the owner actually understands.
  - **Library:** `exceljs` (MIT, multi-sheet) — justified new dep; preferred over
    SheetJS. (JSON export kept as an optional dev/machine format.)
  - **Import is safe by construction:** rows keyed by **slug**; the upload runs the
    same **zod + integrity checks** as the seed and **reports errors row-by-row,
    rejecting the file before any write**. Default mode = **upsert/update** (never
    deletes from a removed row); a separate **"full replace"** mode requires an
    explicit confirm and **auto-backs-up first**. Only cell *values* are read
    (formatting/formulas ignored).
  - **Images stay URLs:** the sheet carries the blob **image URL**, not the binary;
    photo/logo upload remains in the admin (`ImageField`).
- **Login lockout recovery:** if the magic-link email fails or `ADMIN_EMAIL` is wrong,
  the owner must not be locked out — a documented break-glass (env-based re-grant or a
  small CLI) to restore access.
- **Housekeeping:** delete the old blob when an image is replaced/removed (no orphan
  storage). **Admin UI language:** Turkish (the owner's language) — the admin chrome
  is not part of the tr/en/ru public switcher.

## 7. Phased tasks & acceptance

| Task | Scope | Done when |
|------|-------|-----------|
| **A. Seedless deploy** | Deploy runs migrate only; remove reconcile; demote content seed to `seed:demo` (dev-only) | A fresh prod DB comes up **empty**; re-runs never delete/overwrite |
| **B. Cache tags** | `cacheTag` in data-access; a `revalidateMenu()` helper | An edit reflects on the public page after `revalidateTag` |
| **C. Data safety (must-have)** | Verify managed-Postgres backups/PITR; soft-delete/trash for products & categories (or block non-empty delete); **Excel (.xlsx) export/import** (exceljs, slug-keyed, zod+integrity-validated, upsert default / confirmed full-replace, images as URLs); login break-glass; blob orphan cleanup | Backups verified + restore tested; a deleted item is recoverable; owner can **export to Excel, edit, and re-import to rebuild the DB** (bad files rejected with row errors); no lockout path |
| **T12 Auth + first run** | Auth.js magic-link; `ADMIN_EMAIL`; first-run creates admin + Business/Venue on empty DB | On an empty DB, the owner logs in and reaches `/admin`; no seed used |
| **T13 CRUD (create-first, inline)** | Inline Edit/Delete + "＋ Add" controls on the live pages (admin-session islands) opening **modal forms**; server actions + zod for **add/edit/delete categories & products**, prices, translations, per-venue visibility/order; auto-slug; revalidate on write | On an empty DB the owner **builds a full menu in place** (＋ Add category → ＋ Add product in a modal → set price → appears live); guests see none of it; validation blocks bad input |
| **T14 Images & logos** | `ImageField` (tap-pick + preview + remove, optional desktop drag-drop); upload to blob storage; `remotePatterns`; `Product.image` = URL; **logos too** (venue wordmark + brand mark → data); PNG/WebP for logos (SVG XSS) | Owner uploads a product photo **and a logo/wordmark** → both render on the menu |
| **Sec + tests** | Rate-limit, audit log, noindex; e2e of the human flow (login → add category → add product → see it live) | SECURITY.md §2 controls present; e2e green |

## 8. Open questions (confirm with owner)

- **U-admin-1** Auth method: email+password vs magic-link? How many staff accounts?
- **U-admin-2** Image storage provider (Vercel Blob vs S3/R2)?
- **U-admin-3** Do prices ever differ **per venue**, or always equal? (affects the
  price-edit UI — the model already allows per-venue.)
- **U-admin-4** Any approval/draft step, or edits go live immediately?

## 9. What does NOT change

Data-driven venues (no hard-coded slugs), the Product/MenuItem split, URL-based
i18n, the single-language switcher, the static+minimal-JS **public** path — all
preserved. The admin is an additive, isolated, authenticated surface on top of the
existing model; the public menu keeps rendering the same way (now DB-sourced with
tag revalidation instead of seed-on-deploy).

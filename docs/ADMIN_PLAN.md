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

## 2. Caching — the public path stays static, invalidated on write

Public reads use `use cache` (PPR). For edits to appear without redeploying:
- **Tag** the data-access reads: add `cacheTag("menu", "venue:<slug>", …)` inside
  `src/lib/data/menu.ts` (this is the `cacheTag` work deliberately skipped earlier
  as YAGNI — an admin is the consumer that justifies it now).
- **Revalidate on mutation:** every admin write calls `revalidateTag(...)` (and/or
  `revalidatePath`) so the affected public pages rebuild on next request.
- Public pages remain fully static/cacheable between edits — no SSR regression.

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
  **no raw SQL**, non-leaky errors (SECURITY.md §4). Admin routes are `noindex` and
  excluded from `robots`/`sitemap`.
- Admin lives under a dynamic, **non-cached** segment (e.g. `src/app/admin/…`),
  separate from the static public tree.

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

**UX principles (the "easy" bar):** one list per entity with a prominent **"+ Add"**;
one form to edit; mobile-friendly (owner edits from a phone); no jargon (labels like
"Name (Turkish)", "Price", "Show on Terrace"); Save → server action (zod) →
`revalidateTag` → live. Delete asks to confirm. No multi-step wizards.

## 6. Images (T14)

- Product photos move from **committed `public/products/*`** to **object storage**
  (Vercel Blob or S3-compatible) with upload from the admin.
- `Product.image` stores the URL; add the storage host to `next.config` image
  `remotePatterns` (currently empty — SECURITY.md §1 allowlist).
- Validate type/size on upload; strip EXIF; no arbitrary remote fetch.

## 7. Phased tasks & acceptance

| Task | Scope | Done when |
|------|-------|-----------|
| **A. Seedless deploy** | Deploy runs migrate only; remove reconcile; demote content seed to `seed:demo` (dev-only) | A fresh prod DB comes up **empty**; re-runs never delete/overwrite |
| **B. Cache tags** | `cacheTag` in data-access; a `revalidateMenu()` helper | An edit reflects on the public page after `revalidateTag` |
| **T12 Auth + first run** | Auth.js magic-link; `ADMIN_EMAIL`; first-run creates admin + Business/Venue on empty DB | On an empty DB, the owner logs in and reaches `/admin`; no seed used |
| **T13 CRUD (create-first)** | Server actions + zod: **add/edit/delete categories & products**, prices, translations, per-venue visibility/order; auto-slug; revalidate on write | On an empty DB the owner **builds a full menu** (add category → add product → set price → appears live); validation blocks bad input |
| **T14 Images** | Upload to blob storage; `remotePatterns`; `Product.image` = URL | Owner uploads a photo → it renders on the menu |
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

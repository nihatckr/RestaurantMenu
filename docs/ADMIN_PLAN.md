# Admin Plan — owner self-service (Path B)

**Decision (2026-08-28):** the owner will maintain the menu themselves, so we build
an **admin** (auth + CRUD). This resolves the one architectural tension noted in
`DECISIONS.md` (a relational DB with *no* admin). See also `SECURITY.md` §2 — the
write path was always specified; this activates it. Supersedes the earlier
**T11 = no-admin** decision.

This is a **plan**, not yet built. Nothing here ships until its `SECURITY.md`
controls ship with it (AGENTS.md rule 13).

---

## 1. The pivotal change: source of truth moves seed → DB

Today the **seed files are authoritative**: `prisma/seed.ts` + `data/{prices,
translations}.ts` are re-run on every deploy and **reconcile** (delete rows not in
the files). With an admin, the **database becomes the source of truth** and admin
edits must survive deploys.

**Required changes (must land first — otherwise a deploy wipes the owner's edits):**
- **Seed becomes bootstrap-only, idempotent:** `create`-if-missing only; **remove
  every `deleteMany(... notIn ...)` reconcile** and never overwrite existing rows
  (or gate the whole seed behind `if (empty database)`).
- **`vercel-build` pipeline:** stop running `db seed` on every deploy — run
  migrations only; seed once (first deploy / manual). (`DEPLOY.md` update.)
- `data/{prices,translations}.ts` stay as the **initial content** for a fresh DB,
  not a live source. After go-live, content is edited through the admin.

## 2. Caching — the public path stays static, invalidated on write

Public reads use `use cache` (PPR). For edits to appear without redeploying:
- **Tag** the data-access reads: add `cacheTag("menu", "venue:<slug>", …)` inside
  `src/lib/data/menu.ts` (this is the `cacheTag` work deliberately skipped earlier
  as YAGNI — an admin is the consumer that justifies it now).
- **Revalidate on mutation:** every admin write calls `revalidateTag(...)` (and/or
  `revalidatePath`) so the affected public pages rebuild on next request.
- Public pages remain fully static/cacheable between edits — no SSR regression.

## 3. Auth (T12)

- **Library:** **Auth.js v5 (NextAuth)** with the **Prisma adapter** — App-Router
  native, not on the denied-deps list, purpose-built (justified per ARCHITECTURE
  §"dependencies"). Avoids hand-rolling sessions/CSRF.
- **Method:** email + password for a *small* set of staff, hashed with a strong KDF
  (bcrypt/argon2), **or** passwordless email magic-link (fewer secrets to manage).
  Decide with the owner (**U-admin-1**). No public sign-up.
- **Model additions:** `User` (+ `role`), `Session`, `Account`, `VerificationToken`
  (Auth.js adapter tables). Seed the first admin from env, not committed.
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

## 5. Admin CRUD surface (T13)

The admin edits exactly the data that is content today:
- **Products:** identity (kind, tag, category), image; **translations** (tr required,
  en/ru optional) for title/subtitle/description — the `translations.ts` fields.
- **Prices:** single price or labelled measures (CL / glass-bottle) — the
  `prices.ts` shape; per-venue if price ever varies (currently equal).
- **Categories:** name translations, `columns`, order.
- **Per-venue menu:** which categories/items are **visible**, and their **order**
  (the `MenuCategory` / `MenuItem` rows) — data-driven, still no venue-name logic.
- **Venues:** name, wordmark, sort order.

UX: list + edit forms per entity; optimistic-free (server actions + revalidate);
inline validation from the same zod schemas. Keep it small and functional.

## 6. Images (T14)

- Product photos move from **committed `public/products/*`** to **object storage**
  (Vercel Blob or S3-compatible) with upload from the admin.
- `Product.image` stores the URL; add the storage host to `next.config` image
  `remotePatterns` (currently empty — SECURITY.md §1 allowlist).
- Validate type/size on upload; strip EXIF; no arbitrary remote fetch.

## 7. Phased tasks & acceptance

| Task | Scope | Done when |
|------|-------|-----------|
| **A. Bootstrap-safe seed** | Remove reconcile/overwrite; deploy runs migrate only | Re-running seed/deploy never deletes or overwrites existing rows |
| **B. Cache tags** | `cacheTag` in data-access; helper to revalidate | An edit (manual DB change) reflects after `revalidateTag` |
| **T12 Auth** | Auth.js + Prisma adapter; admin-only; first user from env | Only an authenticated admin reaches `/admin`; sessions secure |
| **T13 CRUD** | Server actions + zod for products/translations/prices/categories/menu/venues; revalidate on write | Owner edits a price/translation in the UI → public page updates; validation blocks bad input |
| **T14 Images** | Upload to blob storage; `remotePatterns`; `Product.image` = URL | Owner uploads a photo → it renders on the menu |
| **Sec + tests** | Rate-limit, audit log, noindex; e2e of the human admin flow (login → edit → see change) | SECURITY.md §2 controls all present; e2e green |

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

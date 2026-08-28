# Deploy & Cutover Runbook — RestaurantMenu

Concrete steps to take the app live and migrate `menu.monohotelantalya.com` off
the interim SaaS (menu1.io). See `OPS.md` (infra), `SECURITY.md` (controls),
`DATA_SOURCING.md` (data/cutover). Deploying requires the owner's accounts —
these are the steps to run; an agent cannot perform account/DNS actions.

## Prerequisites
- A managed **PostgreSQL** (Neon / Supabase-Postgres / RDS — Postgres itself).
- A host for Next.js (**Vercel**-style; the current SaaS already runs on Vercel).
- Access to the **DNS** for `monohotelantalya.com`.

## Environment variables (host dashboard, never committed)
| Var | Purpose |
|---|---|
| `DATABASE_URL` | **Pooled** connection for the app runtime (serverless pooler — `OPS.md`). |
| `DIRECT_URL` | **Unpooled** connection for `prisma migrate deploy` (wired in `schema.prisma` `datasource.directUrl`). |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `https://menu.monohotelantalya.com` (metadata/OG/sitemap). |
| `SESSION_SECRET` | Random ≥32-char secret for the encrypted admin session cookie (`iron-session`). |
| `ADMIN_PASSWORD` | The owner's admin password — used **once** by `npm run seed:admin` to store its bcrypt hash in the DB (not read at runtime). Use a strong value (not the dev `1234`). |
| `BLOB_READ_WRITE_TOKEN` | **Required for image uploads.** Create a Vercel Blob store and copy its token. Without it, uploads are rejected on Vercel (ephemeral fs) — see `images.ts`. |
| `BUSINESS_NAME` | *(optional)* Name for the Business row `seed:admin` bootstraps (default "İşletme"; rename later in Settings → İşletme). |

## First deploy (Vercel + managed Postgres)
1. **Provision Postgres** (Neon / Vercel Postgres / Supabase-Postgres). Copy the
   **pooled** URL → `DATABASE_URL` and the **direct/unpooled** URL → `DIRECT_URL`.
2. **Import the repo** into Vercel (`github.com/nihatckr/RestaurantMenu`); set
   **Root Directory = `RestaurantMenu`**. Framework auto-detects as Next.js.
3. **Set env vars** (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`) for
   Production (and Preview).
4. **Deploy.** Vercel runs the `vercel-build` script automatically:
   `prisma generate && prisma migrate deploy && next build` — **migrate-only, no
   seed** (Path B, done 2026-08-28). The **DB is the content source**; deploys never
   touch content, so owner edits are safe. A fresh prod DB comes up **empty** —
   `seed:admin` (step 5) creates the admin **and** a Business row; the owner then
   logs in and adds the first venue in **Settings → Mekanlar**, then builds the menu
   (`ADMIN_PLAN.md` §1).
   > **Demo data (dev only):** `npm run seed:demo` populates an **empty** dev DB with
   > the sample menu; it **bails out if the DB already has content** (never
   > overwrites). To re-apply changed demo data locally, `npm run db:reset` first.
5. **Seed the admin (once).** With `ADMIN_PASSWORD` set to the owner's password, run
   `npm run seed:admin` against the prod DB (locally with the prod `DATABASE_URL`, or
   a one-off job) — it bcrypt-hashes the password into the `AdminUser` row so the
   owner can log in at `/tr/login`. Re-run to change the password.
6. **Verify:** `/` (→ redirects to `/tr`), `/tr` (venue chooser), `/tr/terrace`,
   `/en/terrace`, `/ru/terrace`, a category page, `/api/health` → `{status:"ok"}`,
   `/robots.txt`, `/sitemap.xml`, and the security headers (CSP, HSTS, nosniff).

## Cutover (replace the SaaS)
1. Keep the SaaS live until parity is confirmed (`menu-parity-check`; T10 /
   integration tests) and the first deploy passes on a temporary URL.
2. Point `menu.monohotelantalya.com` DNS at the new deployment. Preserve any QR
   deep-link paths (QR codes in-venue likely target this domain — keep the same
   URL so printed codes keep working).
3. Confirm HTTPS/HSTS on the custom domain; re-check headers + `/api/health`.
4. Decommission the SaaS once traffic is served by the new app.

## Post-launch checks (SECURITY.md DoD)
- Security headers present incl. CSP; `next/image` only serves allowlisted hosts
  (currently local `/public` only).
- Secrets are env-only; no secret in the client bundle.
- CI green (typecheck / lint / test / build / `npm audit`).
- No analytics/trackers unless a privacy/consent decision was made (KVKK/GDPR).

## Known follow-ups (not blockers for a soft launch)
- **Real prices** (U5) — seed currently uses flagged placeholders.
- **Drink multi-measure pricing** (U4).
- **Alcohol/allergen legal display** (U12) — confirm before public launch.

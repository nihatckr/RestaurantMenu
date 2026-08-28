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

## First deploy (Vercel + managed Postgres)
1. **Provision Postgres** (Neon / Vercel Postgres / Supabase-Postgres). Copy the
   **pooled** URL → `DATABASE_URL` and the **direct/unpooled** URL → `DIRECT_URL`.
2. **Import the repo** into Vercel (`github.com/nihatckr/RestaurantMenu`); set
   **Root Directory = `RestaurantMenu`**. Framework auto-detects as Next.js.
3. **Set env vars** (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`) for
   Production (and Preview).
4. **Deploy.** Vercel runs the `vercel-build` script automatically:
   `prisma generate && prisma migrate deploy && prisma db seed (tsx) && next build`.
   So **migrations + seed run on every deploy** — the seed is idempotent and is the
   single content source (no admin, `PRODUCT.md` A3). Updating content/prices =
   edit the repo (`prisma/data/prices.ts`, `prisma/seed.ts`) + redeploy.
5. **Verify:** `/` (venue chooser), `/terrace`, `/garden`, a category page,
   `/api/health` → `{status:"ok"}`, `/robots.txt`, `/sitemap.xml`, and the security
   headers (CSP, HSTS, nosniff).

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

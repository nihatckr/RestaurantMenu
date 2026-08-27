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
| `DATABASE_URL` | Pooled connection for the app runtime (serverless pooler — `OPS.md`). |
| `DIRECT_URL` | Unpooled connection for `prisma migrate deploy` (add to `schema.prisma` datasource when set). |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `https://menu.monohotelantalya.com` (metadata/OG). |

## First deploy
1. Provision the Postgres DB; copy its pooled + direct URLs into the host env.
2. Connect the Git repo (`github.com/nihatckr/RestaurantMenu`) to the host; set
   the project root to `RestaurantMenu/`, build `npm run build`.
3. Run migrations against prod (pipeline step or one-off):
   `npm run db:deploy`.
4. Seed the catalog once: `npm run db:seed` (seed-data is the content source —
   `PRODUCT.md` A3). Re-run after any content/price edit, then redeploy (or
   revalidate) so `use cache` picks up changes.
5. Deploy. Verify: `/` (venue chooser), `/terrace`, `/garden`, a category page,
   `/api/health` → `{status:"ok"}`, and security headers (CSP, HSTS, nosniff).

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

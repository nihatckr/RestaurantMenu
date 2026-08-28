# Operations & Deployment Plan — RestaurantMenu

> Keep ops as small as the app: a read-mostly Next.js menu on managed hosting +
> managed Postgres. No microservices, no queues, no realtime (`ARCHITECTURE.md`).
> Security controls referenced here live in `SECURITY.md`.

---

## Hosting
- **App:** Next.js App Router on a managed platform (Vercel-style; the current
  live SaaS already runs on Vercel, so it's a proven fit for the domain). Static
  /ISR pages at the edge; Server Components for reads; Server Actions for the
  (deferred) writes.
- **Database:** managed **PostgreSQL** (e.g. Neon/Supabase-Postgres/RDS —
  *Postgres itself*, not the Supabase SDK/stack which is denied). Single primary;
  no sharding.
- **Assets/images:** self-hosted object storage or the platform's image pipeline;
  re-host product images (avoid the SaaS CDN dependency — `DATA_SOURCING.md`).

## Environments
- `development` (local), `preview` (per-PR), `production`.
- Each has its own `DATABASE_URL` and secrets; **no prod secrets outside prod**.
- Seed data runs in dev/preview; production is seeded once at cutover from the
  agreed source.

## Configuration & secrets (see SECURITY.md §3)
- All secrets via environment: `DATABASE_URL`, and later `AUTH_SECRET` +
  provider keys if admin/Auth.js is built.
- `.env*` git-ignored; no secret in the client bundle (no `NEXT_PUBLIC_` secret).
- Document required env vars in a committed `.env.example` (names only).

## CI/CD
- On PR: `typecheck`, `lint`, `test`, `build`, and **dependency audit**
  (AGENTS rule 9 + SECURITY.md §4). Red = no merge.
- On merge to main: deploy to `preview`/`production` per branch policy.
- **Migrations run in the deploy pipeline** (a dedicated step with a privileged
  DB role), never from the running app process (SECURITY.md §3).

## Database operations
- **Migrations:** Prisma Migrate; forward-only, reviewed; applied in deploy step.
- **Least privilege:** app runtime uses a non-superuser role scoped to the app
  schema; migration role is separate.
- **Serverless connection pooling (important on Vercel-style hosts):** a
  serverless/edge runtime opens many short-lived connections and will exhaust a
  plain Postgres. Use a **pooler** — the provider's pooled connection
  (e.g. Neon/Supabase PgBouncer endpoint) or **Prisma Accelerate** — for the
  runtime `DATABASE_URL`, and a **direct** (unpooled) URL for
  `prisma migrate deploy` (`directUrl` in the schema datasource). This is the
  standard Prisma-on-serverless setup.
- **Backups:** rely on managed-Postgres automated backups; verify PITR/retention
  is enabled. Menu data is small and low-churn, so RPO/RTO needs are modest but
  should be confirmed, not assumed.

## Observability (light; scale only if needed)
- **Errors:** a non-leaky error boundary in-app (users see generic messages);
  optional error tracking (e.g. Sentry) is a later add, not MVP.
- **Uptime:** basic uptime/health check on the public menu URL.
- **Logs:** platform logs; do **not** log PII or `clientIp` without a privacy
  decision (SECURITY.md §5). No analytics/trackers by default.

## Release & rollback
- Immutable platform deployments → rollback = redeploy previous build.
- DB changes are the only non-trivial rollback risk; prefer additive,
  backward-compatible migrations; pair breaking changes with a plan.
- **Cutover** from the SaaS domain is a one-time coordinated release
  (`DATA_SOURCING.md` → Cutover): switch DNS only after T10 parity + T16 checks.

## Definition of Done (ops)
CI enforces the quality + audit gates; envs/secrets are separated and env-only;
migrations run in-pipeline with least privilege; managed backups verified; a
documented, reversible deploy + cutover path exists. Anything heavier
(monitoring stack, autoscaling, DR drills) is deferred until real usage justifies
it.

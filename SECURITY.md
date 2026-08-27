# Security Plan — RestaurantMenu

> Scope-matched to `PRODUCT.md` + `ARCHITECTURE.md`: a **read-only public menu**
> (Server Components → Prisma → PostgreSQL) with an **optional, later** admin.
> No guest accounts, no payments, no ordering. Security effort is sized to that
> reality — most risk lives in the (deferred) admin/write path, not the public
> read path. Controls are mapped to the `TASKS.md` stages.

---

## Assets to protect
1. **Catalog integrity** — no unauthorized create/edit/delete of Products,
   MenuItems, Categories, Venues (defacement of a public brand surface).
2. **Admin credentials / sessions** — the only real authN/authZ surface (once
   admin exists).
3. **Database & secrets** — `DATABASE_URL`, Auth secrets, any API keys.
4. **Availability** — the menu should stay up and fast (it's guest-facing).
5. **Minimal PII** — this product intentionally collects **no guest PII**. Keep
   it that way (note: the legacy/SaaS site loaded GA + MS Clarity + logged
   `clientIp`; **do not** carry those in without a privacy decision).

## Trust boundaries
- **Public (untrusted):** anonymous guests hitting `/[venueSlug]` reads. No
  writes reachable.
- **Admin (trusted, deferred):** authenticated staff performing mutations via
  Server Actions / Route Handlers.
- **Server ↔ DB:** app server is the only DB client; DB is never public.

---

## Threat model & controls

### 1. Public read path (Server Components → data-access → Prisma)
- **SQL injection** → Prisma parameterizes all queries; **never** use
  `$queryRawUnsafe` / string-built SQL. If raw is unavoidable, use tagged
  `$queryRaw` with parameters.
- **XSS via CMS/catalog text** → React escapes by default. **Ban
  `dangerouslySetInnerHTML`** for catalog fields (title/description/etc.). If
  rich text is ever needed, sanitize server-side (allowlist).
- **Untrusted image URLs / SSRF via `next/image`** → configure
  `images.remotePatterns` to an **allowlist** of known asset hosts only; do not
  allow arbitrary remote hosts. Prefer self-hosted/uploaded images.
- **Enumeration / scraping / DoS on reads** → cache/ISR the public pages
  (static-ish menu), set sane revalidation, and rely on the edge/CDN. Optional
  rate-limit at the platform layer. No sensitive data is exposed by enumeration.
- **Venue slug tampering** → resolve slug to a Venue record; unknown/inactive →
  `notFound()`. Never trust the slug beyond a lookup key (AGENTS rule 10).

### 2. Admin / write path (deferred — build only with T11=go)
- **AuthN** → Auth.js; admin-only. No guest auth. Strong password or SSO;
  secrets via env, never in repo. Secure, `HttpOnly`, `SameSite` session cookies.
- **AuthZ** → every Server Action / Route Handler **re-checks the session +
  role server-side** (never rely on hidden UI). Deny-by-default.
- **CSRF** → Server Actions have built-in origin protection; for any custom
  Route Handler mutation, verify origin / use anti-CSRF. `SameSite=Lax/Strict`
  cookies.
- **Input validation** → validate/parse **all** mutation input with a schema
  (e.g. zod) at the boundary; reject unknown fields; coerce types. Applies to
  prices, slugs, order, language fields.
- **Mass assignment** → map validated DTO → explicit Prisma fields; never spread
  raw request bodies into `prisma.update({ data })`.
- **File/image upload** (if admin uploads images) → validate content-type &
  size, re-encode/strip metadata, store with random names, serve from an asset
  host; never execute uploads.
- **Brute force** → rate-limit login; generic error messages; lockout/backoff.
- **Audit** → record who changed what (createUser/modifiedUser already implied by
  the legacy SaaS model) for catalog mutations.

### 3. Data, secrets, infrastructure
- **Secrets** → only via environment (`DATABASE_URL`, `AUTH_SECRET`, etc.);
  `.env*` git-ignored; no secrets in client bundles (no `NEXT_PUBLIC_` secrets).
- **DB least privilege** → app connects with a non-superuser role limited to the
  app schema; migrations run with a separate privileged role in deploy only.
- **Transport** → HTTPS/HSTS everywhere (platform default on Vercel-style hosts).
- **Migrations** → run in deploy pipeline, not from the running app process.

### 4. Application & dependency hygiene
- **Security headers** → set via `next.config`/middleware: a **Content-Security
  -Policy** (scripts/styles/img/connect allowlists), `X-Content-Type-Options:
  nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` (or CSP `frame-ancestors`),
  `Permissions-Policy`. No inline scripts beyond what Next needs.
- **Third-party scripts** → analytics/trackers (GA, Clarity) are **opt-in
  decisions**, not defaults; each must be justified and reflected in CSP + a
  privacy note. Default MVP ships **none**.
- **Dependencies** → keep the small stack; `npm audit` (or equivalent) in CI;
  no denied/legacy deps (AGENTS rule 8). Pin and update deliberately.
- **Error handling** → generic error pages to users; no stack traces / DB errors
  leaked to the client (legacy leaked raw `Error! {error}` strings — do not
  repeat).

### 5. Privacy / compliance
- **Data minimization** → collect no guest PII; do not log `clientIp` or set
  tracking cookies without a documented lawful basis + consent (KVKK/GDPR; TR
  business, EU-language visitors).
- If analytics are later added → consent banner + CSP entries + privacy notice.

---

## Mapping to TASKS.md (security is not a single late task)
- **T1 Foundation** → security headers/CSP baseline, `.env` hygiene, `npm audit`
  in CI, error boundary with non-leaky messages.
- **T2 Database model** → least-privilege DB role, migrations separated,
  audit-friendly `createUser/modifiedUser` fields.
- **T3 Data-access** → parameterized-only queries; no raw SQL; slug→record
  lookups.
- **T7/T8 Public render** → no `dangerouslySetInnerHTML`; `next/image`
  `remotePatterns` allowlist.
- **T12 Auth** → Auth.js hardening, session cookie flags, brute-force limits.
- **T13/T14 Mutations** → zod validation, server-side authZ on every action,
  anti-mass-assignment, CSRF checks, audit logging.
- **T16 Production readiness** → header/CSP verification, dependency audit,
  secret-scanning, penetration smoke-test of admin, privacy/consent decision.

## Definition of Done (security)
Every mutation is authenticated + authorized server-side and schema-validated;
the public path exposes no writes and leaks no errors/PII; secrets live only in
env; security headers + `next/image` allowlist are in place; CI runs a dependency
audit. Deferred items (admin, analytics) carry their controls **as a
precondition of being built**, per `AGENTS.md`.

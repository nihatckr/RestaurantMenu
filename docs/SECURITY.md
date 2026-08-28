# Security Plan — RestaurantMenu

> Scope-matched to `PRODUCT.md` + `ARCHITECTURE.md`: a **read-only public menu**
> (Server Components → Prisma → PostgreSQL) with a **single-owner admin**
> (**shipped 2026-08-28**, Path B — see `ADMIN_PLAN.md`). No guest accounts, no
> payments, no ordering. Security effort is sized to that reality — most risk lives
> in the admin/write path, which ships **with** the controls below. Controls are
> mapped to `TASKS.md`.
>
> **As built:** auth is **`iron-session` (encrypted, httpOnly cookie) + bcrypt**,
> single owner, **username + password** (not Auth.js — no multi-user/email needed).

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
- **Admin (trusted — shipped, Path B):** the authenticated single owner performing
  mutations via Server Actions / admin Route Handlers.
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

### 2. Admin / write path (SHIPPED — Path B, 2026-08-28) ✅
> The owner self-updates the menu; the admin shipped **with** all controls below.
> Consolidated hardening checklist: `ADMIN_PLAN.md` §4b.
- **AuthN** → ✅ **`iron-session`** (encrypted, `HttpOnly`, `SameSite=Lax`,
  `secure` in prod) + **bcrypt**; single owner, **username + password**
  (`verifyCredentials`). `SESSION_SECRET` via env. (Not Auth.js — no multi-user.)
- **AuthZ** → ✅ every Server Action / admin Route Handler calls **`requireAdmin()`
  server-side** (never trusts hidden UI); `/admin/*` routes return 401 unauthenticated.
  Verified by e2e.
- **CSRF** → ✅ Server Actions carry built-in origin protection; the session cookie
  is `SameSite=Lax`. (No custom mutating Route Handlers.)
- **Input validation** → ✅ all mutation input parsed with **zod** at the boundary
  (`schemas.ts`), server re-validates; unknown fields rejected, types coerced.
- **Mass assignment** → ✅ validated DTO → explicit Prisma fields; no request-body
  spreads into `prisma.update({ data })`.
- **File/image upload** → ✅ content-type + size checked, **`sharp` re-encodes to a
  bounded, metadata-stripped WebP**, random blob keys, served via **Vercel Blob**
  (dev-local fallback); uploads never executed. Non-image / oversized rejected (e2e).
- **Brute force** → ✅ in-process login throttle (5 fails → 5-min lock) + generic
  "kullanıcı adı veya şifre hatalı". *(Per-instance only; distributed lock via
  Upstash is a documented follow-up.)*
- **Audit** → ✅ every content mutation writes an **`AuditLog`** row (action/entity/
  detail/time); shown in Settings → "Son işlemler".
- **Not-indexed** → ✅ `/login` + `/settings` carry `robots: noindex`.

### 3. Data, secrets, infrastructure
- **Secrets** → only via environment (`DATABASE_URL`, `SESSION_SECRET`,
  `BLOB_READ_WRITE_TOKEN`, etc.); `.env*` git-ignored; no secrets in client bundles
  (no `NEXT_PUBLIC_` secrets).
- **DB least privilege** → app connects with a non-superuser role limited to the
  app schema; migrations run with a separate privileged role in deploy only.
- **Transport** → HTTPS/HSTS everywhere (platform default on Vercel-style hosts).
- **Migrations** → run in deploy pipeline, not from the running app process.

### 4. Application & dependency hygiene
- **Security headers** → set via `next.config` (implemented): a **static
  Content-Security-Policy** plus `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS.
  **CSP decision:** static (no nonce). A nonce requires per-request **dynamic
  rendering** (Next docs), which would defeat the static/PPR menu shell. Given a
  read-only menu with no user input and no `dangerouslySetInnerHTML`, the XSS
  surface is minimal, so a static policy is the right trade. `'unsafe-inline'`
  is required for Next's hydration/streaming; `'unsafe-eval'` is dev-only.
  Revisit (nonce + dynamic) only if user-generated content or an authed admin is
  added.
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
- **T12 Auth** → ✅ iron-session + bcrypt, cookie flags, brute-force throttle.
- **T13/T14 Mutations** → ✅ zod validation, `requireAdmin` on every action,
  anti-mass-assignment, sharp-re-encoded uploads, audit logging.
- **T16 Production readiness** → ◐ headers/CSP verified, dependency audit in CI;
  **owner/ops remaining:** least-privilege DB role, DB backup/PITR test, penetration
  smoke-test, privacy/consent decision if analytics are ever added.

## Definition of Done (security)
Every mutation is authenticated + authorized server-side and schema-validated;
the public path exposes no writes and leaks no errors/PII; secrets live only in
env; security headers + `next/image` allowlist are in place; CI runs a dependency
audit. Additive items (the admin now being built; analytics still deferred) carry
their controls **as a precondition of being built**, per `AGENTS.md`.

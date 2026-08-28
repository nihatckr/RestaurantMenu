# Decision Log — RestaurantMenu

An auditable record of **what was requested, why, what changed, how it was
approved, and the resulting commit** — from the first Figma analysis to today.

**Fidelity note:** this log is reconstructed from the git history, the project
docs (`JOURNEY.md` has the fuller narrative) and the working session record.
Entries are faithful in **decision, rationale and approval**; pre-session request
wording is paraphrased (not always a verbatim quote). Approvals shown as quotes
(`"evet"`, `"push et"`, `"kodlarımıza bak"`) are the user's own words where known;
`AskUserQuestion` marks a choice made through the in-chat option picker.

Legend — **Approval:** `verbal` = asked in chat · `AskUserQuestion` = picked an
option · `"…"` = the user's own phrase. **U#/T#** = tracked unknowns/tasks.

---

## Phase 0 — Discovery & Figma

| # | Request | Why | What changed | Approval | Commit / artifact |
|---|---------|-----|--------------|----------|-------------------|
| 0.1 | Analyse the Mono Figma files | Ground the design in real brand assets/tokens | Extracted palette, wordmark/logo system, menu layouts; saved findings | `"evet"` (save to memory) | memory + `JOURNEY.md` §0 |
| 0.2 | Build the new app, retire the legacy forks | Legacy Terrace/Garden were Vite/Apollo reading a dead WP backend | Decided one Next.js app, legacy = READ-ONLY evidence | verbal | `AGENTS.md`, `LEGACY_AUDIT.md` |

## Phase 1 — Foundation, data model, public menu

| # | Request | Why | What changed | Approval | Commit |
|---|---------|-----|--------------|----------|--------|
| 1.1 | Scaffold the app | Start clean on the agreed stack | Next.js 16.3, TS, Tailwind v4, fonts, security headers, CI | verbal | `c2c67d5` |
| 1.2 | Database model | Shared catalog + per-venue facts | Prisma schema, Product/MenuItem split, 2-venue seed | verbal (`U11`=two venues) | `5a558e1` |
| 1.3 | Public menu pages | The core guest flow | Venue landing + single-scroll category page (`use cache`/PPR) | verbal | `cfa5c97`, `833145d` |
| 1.4 | Responsive layout | Menu is a phone/QR surface | Mobile-first grids (no fixed 390px) | verbal | `404966a` |
| 1.5 | Tests | Lock in per-venue behaviour | Vitest unit + DB integration + CI Postgres | verbal | `41d44cc` |
| 1.6 | No admin UI | Content is managed via seed | T11 = no-admin; seed is the content source | verbal | `4f6e506` |
| 1.7 | Real photos, prod-readiness, SEO, deploy prep | Ship-ready public menu | Legacy photos, CSP/health/robots, per-page metadata + sitemap, Vercel pipeline | `"commit et"`, `"push et"` | `f2f861a`, `2e00720`, `161b3e5`, `b24aba1` |
| 1.8 | Multi-measure drink pricing | Legacy had 4/8 CL, bottle/glass | `MenuItemPrice` child table | `"hepsini yap"` | `0a82fa1` |
| 1.9 | Legal price-label compliance | TR Law 6502 | VAT-included / no-service-charge footer + `COMPLIANCE.md` | verbal (`U12`) | `9601f8a` |

## Phase 2 — Legacy & Figma fidelity (corrections-heavy)

| # | Request | Why | What changed | Approval | Commit |
|---|---------|-----|--------------|----------|--------|
| 2.1 | Show TR + EN together | Match legacy bilingual display | `bilingual()` helper + alt lines | verbal | `05fbc28` *(later superseded — see 6.1)* |
| 2.2 | Wines must be **cards** | I had wrongly rendered them as a table | Table restricted to tag-grouped hard drinks; wines stay cards | `"şaraplarda card gösterimli olması lazım"` | part of parity pass |
| 2.3 | Hard drinks like the legacy (35/50/75) | My version missed bottle sizes | GLASS/BOTTLE grouped columns from legacy `MenuItemHardDrinks` | `"35 50 75 seçenekleri vardı"`, `"eski kodlarına bak"` | `68cb1fb`, `5038f98` |
| 2.4 | Alcohol section must match exactly | Parity | Tag sub-grouping (Viski/Rakı/…), EN tag labels | `"alkollü içeceklerde birebir olmalı"` | `2820e3d` |
| 2.5 | Softs share the beer-card discipline | Consistency | Soft drinks use the same bordered-price block | `"aynı disiplin"` | `3d5952a` |
| 2.6 | Add spirits with various CL | Populate the structure | Added spirit products + measures (flagged DEMO) | `"çeşitli cl varyasyonlarına sahip"` | `5038f98` |
| 2.7 | Cocktails with photos, colour chips, beer CL, featured | Restore ~18 legacy card variants | Image-driven card variant; `Product.color` chips; featured full-width | verbal | `e947b12`, `7b7d50c`, `3d5952a` |
| 2.8 | **Remove invented drinks** | I had invented beer/wine/spirit names — not evidence-backed | Deleted them; seed made authoritative (reconcile) | correction (`AGENTS.md` 5–6) | `0267d23` |
| 2.9 | Fonts must follow the legacy `theme.js` | I had "unified" fonts on my own instinct | Restored price/cl = Mono, title/desc = Inter | `"fontlar … nasıl kullanıldıysa öyle kullanılmalı"` | `64aa191` *(reverts `d468a8b`)* |
| 2.10 | Centralised styling; no dividers; no thousands dot; dotless English I | Consistency + correctness | Central `.type-*` roles; removed dividers; `useGrouping:false`; `lang` + CSS caps | verbal | `28df6d4` |
| 2.11 | TR & EN names stacked (alt alta) | Legacy layout | Hard-drink name stacks TR over EN | `"alt alta olmalı"` | `0025e6d` |
| 2.12 | Legacy letter-spacing per context | Fidelity to `theme.js` | Per-call-site tracking | verbal | `1cfb967` |

## Phase 3 — Category set & per-venue behaviour (flip-flops, settled by code)

| # | Request | Why | What changed | Approval | Commit |
|---|---------|-----|--------------|----------|--------|
| 3.1 | Breakfast only on Terrace | Verbal: "Garden has no breakfast" | Made breakfast Terrace-only | `"gardenda kahvaltı hizmeti yok"` | `fc83280` |
| 3.2 | **Correction:** follow the code | Legacy Navigation hides breakfast on **Terrace**, shows on Garden | Reverted to Terrace-hides / Garden-shows | `"kodlarımıza bak"` → "Legacy'ye uy" | `2415650` |
| 3.3 | Add Çerezler + Nargile | Misread as Terrace-only categories | Added them | verbal | `0e206be` |
| 3.4 | **Correction:** they don't exist | Not in the Mono menu at all | Removed; added category reconcile to seed | `"NARGİLE VE ÇEREZLER YOK"` | `b43366b` |
| 3.5 | Drop DEMO per-item venue hiding | Real per-item list is unknown | `HIDDEN_BY_VENUE = {}`; shared catalog shows in both | verbal | `1541e29` |

## Phase 4 — Mobile-first & the responsive standard

| # | Request | Why | What changed | Approval | Commit |
|---|---------|-----|--------------|----------|--------|
| 4.1 | Fix phone hard-drink price wrap + overlapping beer cards | Unreadable on a phone | Responsive 1/2/3-up grids | `"satır kaymaları … iç içe geçiyor"` | `49db7ab` |
| 4.2 | Prices misalign when a measure is missing | "if one has no 35 CL, all shift" | ONE shared CSS grid (header + rows via `Fragment`) | `"birinde 35 cl yoksa hepsi kayıyor"` | `8ca8b8c` |
| 4.3 | Beer cards 2-up with smaller text | 1-up too sparse | 2-up compact grid, smaller type | verbal | `8ca8b8c` |
| 4.4 | One fluid typography standard | "everything scales at the same ratio" | `clamp()` root font-size; all rem | `"bir standart olmalı"` | `b8ac077` |
| 4.5 | A thing's TR & EN share one font | General rule | `.type-subheading` → Mono like its heading | `"Türkçesi hangi fontta ise İngilizcesi de o olmalı"` | `031ac16` |
| 4.6 | Mobile polish | Small-screen readability + a11y | Responsive food grid, focus rings, tap targets | verbal | `1ee1fb4` |

## Phase 5 — Documentation & consolidation

| # | Request | Why | What changed | Approval | Commit |
|---|---------|-----|--------------|----------|--------|
| 5.1 | Document from the start; organise docs into a folder | Capture how we got here | Moved specs to `docs/`; added `JOURNEY.md`, index, diagrams | `"en baştan … mantıklı klasöre al"` | `c6e27b7`, `8ae219f` |
| 5.2 | Is Prisma aligned 1:1 with the frontend? | Verify no drift | Confirmed every consumed field maps through typed data-access | `"prisma frontende birebir hizalı mı"` | verified (typecheck) |
| 5.3 | Docs accuracy pass | Some docs claimed features not built | Marked switcher deferred, TASKS status, DEMO note | verbal | `7d539cd` |

## Phase 6 — Internationalization rework (this session)

| # | Request | Why | What changed | Approval | Commit |
|---|---------|-----|--------------|----------|--------|
| 6.0 | "I don't see a language option" | RU existed in data but was unreachable | (options offered) | `"dil seçeneği göremedim"` | — |
| 6.1 | **Real single-language switcher** | An RU toggle wasn't a proper switcher | `/[locale]` routes, one language at a time, tr fallback; removed bilingual + toggle | `AskUserQuestion`: "tek dil gösteren gerçek switcher" (after "sanırım switcher'ı yanlış kurmadık") | `84cba24` |
| 6.2 | Russian text looks oversized | Mono font has no Cyrillic glyphs | RU brand-text roles → Inter (cyrillic subset) | `"rusça … yazıların boyutları büyüyor"` | `59d5a7d` |
| 6.3 | Why do only categories translate, not products? | Data gap: products mostly tr/en only | Extracted all product text → `translations.ts` fill-in file | `"evet"` (create the fill-in file) | `dd69096` |
| 6.4 | Footer still Turkish — adapt the whole project | Static UI chrome wasn't localized | `messages.ts` catalog; footer/404/error/empty/metadata localized | `"footer da hala türkçe … tüm projeye adapte et"` | `9e9bfce` |
| 6.5 | Align all docs, no inconsistency | i18n rework made docs stale | Swept & fixed 13 docs; removed dead `.type-subheading` | `"tüm dökümanları hizala"` | `d6e0934` |

## Phase 7 — Code quality (this session)

| # | Request | Why | What changed | Approval | Commit |
|---|---------|-----|--------------|----------|--------|
| 7.1 | No hardcoded values; centralize | Code quality | Data-driven seed locales; `brand.ts`, `site.ts`, `CURRENCY`; JSON-LD `inLanguage` fix | `"hardcoded olmamalı … merkeziyetçi"` | `584fcb1` |
| 7.2 | What else can be done? | Further quality | (options offered) → all four chosen | `AskUserQuestion` (multi-select) | — |
| 7.3 | SEO hreflang, seed integrity, RU e2e, DRY helper | Robustness + SEO + coverage | `buildAlternates`, seed self-checks, RU-switch e2e, `localeFromPathname` | `AskUserQuestion` | `bb6a89b` |
| 7.4 | Continue | More quality | OG share image, reduced-motion a11y, committed `.env.example` | `"devam et"` | `a6ab515`, `7fa335a` |
| 7.5 | Push | Ship the session's work | Pushed 9 commits to `origin/main` | `"push et"` | `7d539cd..7fa335a` |
| 7.6 | Add home links to the logos | Logo = standard "go home" affordance | Brand mark + wordmark wrapped in `<Link>`: category pages → venue landing, landing → venue chooser; + a logo-click e2e | `"logolara anasayfa linkleri ekle"` | `1adfc68` |
| 7.7 | Should the header (back + language) be sticky? | Long single-scroll menu — reach back/language at any depth | Slim sticky bar on the category page (back + switcher; brand mark scrolls); landing untouched | `AskUserQuestion`: "İnce sticky bar (geri + dil)" | `0323650` |
| 7.8 | What else (navigation)? → back-to-top button | Quick return on a long scroll | `ScrollToTop` client button (appears after 600px; reduced-motion aware; localized label) on the category page | `AskUserQuestion`: "Yukarı çık butonu" | `6a15215` |
| 7.9 | Add animations without changing the design (GSAP or Framer?) | Subtle motion, but keep the static/minimal-JS architecture | Recommended & used **native CSS** over a JS lib: scroll-driven `animation-timeline: view()` reveal on sections (0 JS, guarded by `@supports` + reduced-motion so content is never hidden). Rejected GSAP/Framer as over-heavy for this surface (would force client components + bundle). | verbal + my recommendation accepted | *(pending)* |
| B.1 | Owner will self-update the menu → build an admin (Path B) | The DB + no-admin combo was the one architectural tension; owner needs self-service | (planning) content source of truth shifts DB←seed; admin auth+CRUD+cache revalidation — see `ADMIN_PLAN.md` | `"sahip menüyü kendi güncelleyecek — admin planla (B)"` | *(planning)* |
| B.2 | Keep it simple/easy | Owner needs an easy tool, not a CMS | Revised plan to a lean UX (one list + form per entity, magic-link, sensible defaults); robust extras (audit log, heavy rate-limit) pushed to later phases | `"asla karmaşık olmayan ve kolay kullanabilir"` | *(planning)* |
| B.3 | Must support **add category + add product**, and set up **without seed data** on admin login | It's a menu *builder*, not just an editor; production starts empty | Plan: full create/edit/delete for categories & products; **no content seed** (demo→`seed:demo` dev-only); first-run creates admin + Business/Venue on an empty DB, then owner builds the menu | `"kategori ekleme olmalı ürün ekleme olmalı seed data olmadan … admin giriş yaptığında"` | *(planning)* |
| B.4 | Admin as **inline edit mode** on the live pages (not a separate dashboard); **create/edit via modal forms** | Simpler/WYSIWYG for the owner | Plan: guests get the static page; admin session renders inline Edit/Delete + "＋ Add" island controls; Add/Edit open accessible modal forms, Delete confirms; server actions re-check the session | `"bu yönde gidelim … eğer bir create olacaksa bu da modal açılmalı form"` | *(planning)* |
| B.5 | Admin UI stack: Lucide icons, zod, RHF/Formik, Zustand/Redux? | Pick a lean, consistent stack | **lucide-react** (icons), **zod** (shared client+server schema), **react-hook-form + @hookform/resolvers** (over Formik — lighter), native `<dialog>` modal. **Redux/Zustand REJECTED** — denied by AGENTS.md rule 8 **and** not needed (React state + server actions suffice). | `"Lucide … zod … zustand yada redux … reactform hook yada formik … sen karar ver"` | *(planning)* |
| B.6 | Modal implementation | Minimal deps, enough for ~4 dialogs | **native `<dialog>`** + one thin `<Modal>` wrapper (React open-sync + focus return, backdrop-click close, body scroll-lock); native-CSS enter/exit animation. Radix kept as fallback only. | `"native dialog ile devam et"` | *(planning)* |
| B.7 | Tailwind helpers/components? | Keep the bespoke brand look, minimal deps | **No UI kit** (shadcn=reintroduces Radix; DaisyUI clashes with the design). Use a small **`cn()`** (clsx + tailwind-merge) + hand-rolled primitives (Button/Input/Textarea/Field/Modal). cva only if variants grow; `prettier-plugin-tailwindcss` optional. | `"tailwindcss için ne önerirsin … yoksa ihtiyac yok mu"` | *(planning)* |
| B.8 | React Query / TanStack needed? | Avoid duplicating Next's caching / client-fetch | **No.** App Router + Server Actions cover it: Server Components + `use cache`/`cacheTag` (fetch+cache), `revalidateTag` (refresh), `useActionState`/`useFormStatus`/`useOptimistic` (form/optimistic). TanStack Table also not needed (simple lists). | `"react query yada tanstack … ihtiyacımız var mı"` | *(planning)* |
| B.9 | Redis needed? | Extra managed service — justify or skip | **No for v1.** Read cache = Next; sessions = DB/JWT; rate-limit starts light. Only future justification = distributed rate-limiting on serverless → **Upstash Redis** then. No queues/real-time. | `"redis gibi bir teknolojiye"` | *(planning)* |
| B.10 | Image upload UX — drag-drop? logo too? | Mobile-first, minimal deps | One hand-rolled **`ImageField`** (tap/click pick = mobile camera/gallery, live preview, replace/remove; **drag-drop = optional desktop enhancement**, no lib). Covers **product photos AND logos**: venue wordmark (data already) + brand mark (promote `BRAND.mark` → data). **SVG XSS caveat** → accept PNG/WebP for uploaded logos (or sanitize SVG); keep crafted SVG as fallback. | `"sürükle bırak … ihtiyac var mı"` + `"logo yüklemek dahil"` | *(planning)* |
| B.11 | Where to manage logos/favicon; login/logout in header? | Global brand ≠ per-item; owner needs sign in/out | **Settings page** for global/brand (logo, wordmark, **favicon**, venue details); menu content stays **inline**. **Login** = discreet unlinked route (`/login`, magic-link); **Logout + Settings** in the **sticky header** when logged in (admin-only). Favicon + PWA icons generated from the uploaded logo (sharp) via dynamic routes. | `"favicon dahil … ayarlar sayfasından mı … sticky headerda giriş çıkış"` | *(planning)* |
| B.12 | Optimized upload? into `public/` by category? | Correct a wrong assumption + optimize | **Not `public/`** — it's build-time/read-only on serverless; uploads go to **blob storage**. **Optimized on upload** with `sharp` (WebP/resize/strip) + `next/image` on delivery. Organized by **storage key** (`products/<cat>/…`) for tidiness only — DB URL is the source of truth, no logic on paths. | `"görseller optimize edilerek mi … public klasörümüze kategorilerine göre"` | *(planning)* |
| B.13 | (My flag) Any must-have missing? → **Data safety** | seed→DB removed the "re-seed" safety net; DB loss / bad delete = menu gone | Added a **Data safety** section: verified DB backups/PITR (#1), soft-delete/trash, export/import (**Excel .xlsx — see B.16**), login break-glass, blob orphan cleanup, Turkish admin UI. Ships **with** the admin. | I raised it; user asked "olmazsa olmaz eklenecek konu var mı" | *(planning)* |
| B.14 | Are the security decisions covered (anti-hack)? | Admin adds a write surface | Consolidated a **Security hardening checklist** (§4b): magic-link token+login rate-limit, server-side authz/no-IDOR, zod allow-list, **plain-text fields + React escaping = no stored XSS**, server-mediated authed uploads + sharp re-encode, least-privilege DB, secrets in env, `noindex`, audit log, dependency hygiene; residual `unsafe-inline` CSP noted. Maps to SECURITY.md §2. | `"güvenlik ile ilgili … birileri bizi hacklememesi için"` | *(planning)* |
| B.15 | Further security ideas | Diminishing returns — capture, don't pre-build | Noted phase-in/ops extras: COOP/CORP headers, Vercel firewall/edge rate-limit, session idle-timeout + log-out-everywhere, monitoring/alerting + npm audit/Dependabot, pre-launch pentest + secret rotation, KVKK note. | `"bu anlamda başka neler yapılabilir"` (security) | *(planning)* |
| B.16 | Backup as Excel, re-importable to the DB? | Owner-friendly backup + bulk edit | **Yes** — `.xlsx` export/import (`exceljs`, multi-sheet) as the owner-facing backup/restore + bulk-edit; slug-keyed; import runs zod+integrity checks, **rejects bad files with row errors**; upsert default, confirmed full-replace with auto-backup; images stay URLs; JSON kept as optional dev format. | `"yedek … excel olsa … sonra yüklenebilse ve database'e dönüşse mümkün mü"` | *(planning)* |
| B.17 | Auth method (magic-link vs single password) | One admin only (owner) | **Single password**, owner-only — `iron-session` (encrypted cookie) + bcrypt; no email/multi-user/Auth.js overhead; `/login`+logout, login rate-limit. Resolves U-admin-1. | `"sadece sahip düzenleyecek, tek şifre ile devam et"` | ✅ built (T12) |
| B.17a | Where is the password hash stored? bcrypt lib? | User-friendly, hashed by code | **DB-seeded credential**: `AdminUser` row, hashed by code in `prisma/auth.seed.ts` (`npm run seed:admin`); **bcrypt** (`bcryptjs`, pure-JS — over argon2, no native build) for hash + verify; dev password **`1234`** (`ADMIN_PASSWORD` env, prod sets a strong one). Replaced the env base64-hash approach (dotenv ate the `$`). | `"şifre … kod ile hashlenmeli 1234 olsun … bcrypt … auth.seed.ts ile yükleyebilirsin admin"` | ✅ built |
| B.17b | Session cookie over local http | `next start` runs prod-mode locally → `secure` cookie dropped over http | `secure` in production (HTTPS); `AUTH_ALLOW_HTTP=1` disables it for local `next start`/e2e over http://localhost (never in prod). | (debugged during T12) | ✅ built |
| B.17c | After login the page "stayed on /login" showing "Giriş yapıldı" | Owner shouldn't sit on the login screen | Login (and visiting `/login` while authed) now **redirects to the menu**; logout moved to a global **`AdminBar`** (session-gated island shown on every page when logged in). | `"giriş yaptığımızda loginde kalıyor … giriş yapıldı login sayfasında yazıyor neden"` | ✅ fixed |
| B.20 | Admin edit didn't show immediately in the public nav | The cached read used `revalidateTag(tag,"max")` = serve-stale-while-revalidate | Switched `revalidateMenu` to **`updateTag`** (read-your-own-writes) — the admin's edit shows on the next render (router.refresh) instantly. Only valid in Server Actions (all our mutations are). | (found while testing category CRUD) | ✅ fixed |
| B.18 | Create a task list before coding? | Bridge plan → execution; track prereqs & cross-session | **Yes** — granular, dependency-ordered **execution checklist** in `TASKS.md` (Phases A→B→C→T12→T13→T14 + security/tests), each step with a "done when"; live progress also via the harness task tracker during build. | `"task list oluştur"` | ✅ created |
| B.19 | Does the task list meet the need + fit current code? | Verify before coding | **Yes, verified against the code.** Compatibility strong: public reads already DB-backed (seed files feed only the seed → admin is additive, no read rewrite); single-password = no User/Session tables needed. One gap closed: made **schema migrations explicit** (`deletedAt`, `Business.logo`, `AuditLog`) + added Turkish admin-UI step. | `"task list … amacımıza ihtiyaçlarımızı … ve şu anki kodlarımız ile uyumlu mu"` | ✅ verified |

---

## Cross-cutting principles that emerged (the "why" behind the corrections)

1. **Legacy code is the authority** for fonts, layout and category behaviour — over
   verbal instructions, over Figma, and over my own instincts (2.9, 3.2).
2. **Never invent menu data** — unknowns stay UNKNOWN/DEMO; real values come from
   the owner (`U5`) (2.8).
3. **Data-driven, not name-driven** — no `if (venue === …)`, no hard-coded slugs or
   locale lists in logic (7.1).
4. **Centralise** — one source per concern: design tokens (`globals.css`), typography
   roles, prices (`prices.ts`), text (`translations.ts`), UI strings (`messages.ts`),
   brand (`brand.ts`), site (`site.ts`), locales (`i18n.ts`) (2.10, 4.4, 7.1).
5. **Verify, then commit** — typecheck + lint + unit + e2e (+ a real render check)
   before every clean, single-purpose commit.

For the fuller narrative see `JOURNEY.md`; for intentional divergences from the
legacy see `PARITY.md`; for the task-by-task plan see `TASKS.md`.

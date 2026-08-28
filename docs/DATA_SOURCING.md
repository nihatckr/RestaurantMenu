# Data Sourcing & Cutover Plan — RestaurantMenu

> Problem established in `LEGACY_AUDIT.md` → Live Site Investigation: the legacy
> WordPress GraphQL catalog is **gone**, and the interim menu runs on a
> third-party SaaS (`menu1.io` / `aksungur.app`) at `menu.monohotelantalya.com`
> with an **inactive subscription**. So the new app needs a fresh, owned dataset
> and a plan to take over the live domain.

---

## Where the real data can come from (ranked)
1. **Export from the current SaaS** — best fidelity. Its page payload exposes
   structured `categoryData` (12 categories with slug/order/parent/image); product
   rows load from the `*.aksungur.app` API per category. If the account owner can
   get an official **export** (or the API is still readable while the site is up),
   that yields real names/prices/images/translations. *(Access/legality:
   only with the business's authorization; read what we own.)*
2. **Business-provided source** — a spreadsheet/PDF/current printed menu from the
   restaurant. Most reliable for **prices**, which change often.
3. **Manual entry from legacy reference assets** — the ~80 categorized photos +
   legacy category structure seed a realistic dataset for development even before
   real prices arrive.

> **Do not** invent prices/items. Unknown values stay UNKNOWN and are seeded with
> obvious placeholders flagged for replacement (AGENTS rules 5–6).

## Confirmed target structure (from live check)
- 1 business/customer, currency **TRY**, languages **tr/en/ru**.
- **12 categories** (ordered, hierarchy-capable): Başlangıçlar, Salatalar,
  Makarnalar, Sandviçler, Ana Yemekler, Tatlılar, Kokteyller, Biralar, Şaraplar,
  Alkollü İçecekler, Soft İçecek, Çerezler. (Breakfast dropped; Çerezler added
  vs legacy.)
- Drink items carry structured measures (cl / glass / bottle / multi-column
  spirit pricing) — preserve as typed fields (`DESIGN.md` card variants).

## Import pipeline (Stage: T4 seed)
1. **Acquire** source (export/spreadsheet) → raw files committed to a seed dir
   (no secrets).
2. **Normalize** to the Prisma model: language-neutral fields on Product/MenuItem;
   translatable text into translation rows (`I18N.md`); categories with stable
   slugs + order; venue assignment.
3. **Transform** legacy/SaaS quirks: map old category names → new slugs; convert
   the inverted `*_show_content` visibility into explicit `available` booleans;
   split spirit measures into structured columns.
4. **Load** via an idempotent `prisma db seed` (re-runnable, deterministic).
5. **Verify** against a parity checklist (T10): counts, ordering, per-venue
   visibility, all three languages present-or-fallback.

## Venue decision gate (blocks seed shape)
- Live SaaS shows **one** "Mono Terrace" menu (no Garden). Legacy had **two**.
- **U11** (in `LEGACY_AUDIT.md`) must be answered before T4: seed **one** venue
  or **two**. Schema supports N either way; this only sets how many venues +
  whether the landing offers a venue choice.

## Cutover / go-live (Stage: T16)
- The public entry point is the domain **`menu.monohotelantalya.com`** (QR codes
  in the venue likely point here). Plan a **DNS/hosting switch** from the SaaS to
  our deployment, coordinated so QR codes keep working (same URL).
- Keep the SaaS live until the new app passes parity (T10) + production readiness
  (T16); switch DNS, then decommission the SaaS.
- If QR codes are printed with a specific path, preserve/redirect it.

## Legal / menu-content compliance (flag — not yet evidenced)
- **U12** The menu includes **alcohol** (Beers/Wines/Spirits/Cocktails). Turkish
  regulations may constrain how alcohol menus/prices are displayed and to whom;
  **allergen** disclosure may also be expected. Confirm requirements with the
  business before launch. Do not assume; treat as a launch blocker if unresolved.

## Open questions
- **U5** (source of the real product list/prices) — resolved by step 1 or 2 above.
- **U-data-1** Are product images owned by the business (reusable) or SaaS-hosted
  (must be re-hosted)? Re-host to our own asset store to avoid the CDN dependency.
- **~~U-data-2~~ RESOLVED (2026-08-28):** yes — the owner needs ongoing
  self-service editing, so the **admin was built** (Path B, `ADMIN_PLAN.md`) and the
  **DB is the content source** (not seed-then-static). `seed:demo` is dev-only.

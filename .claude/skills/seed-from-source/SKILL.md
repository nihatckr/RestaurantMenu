---
name: seed-from-source
description: Turn a real catalog source (SaaS export, spreadsheet, or legacy reference) into RestaurantMenu seed data via the acquire→normalize→transform→load→verify pipeline, without inventing unknown values. Use when asked to seed the database, import menu data, build fixtures, or populate categories/products/menu items.
---

# Seed the catalog from a source

Implements the pipeline in `DATA_SOURCING.md`. The real WordPress GraphQL source
is dead and the interim SaaS subscription is inactive (see `LEGACY_AUDIT.md` →
Live Site Investigation), so seed from an explicit acquired source — never guess
prices/items.

## Steps
1. **Acquire.** Get the source (SaaS export / business spreadsheet / legacy
   reference assets). Commit raw inputs to a seed input dir. No secrets.
2. **Normalize.** Map to the Prisma model: language-neutral fields on
   Product/MenuItem; translatable text → translation rows (`I18N.md`, tr required
   + en/ru if present); categories with stable slugs + `order`.
3. **Transform legacy/SaaS quirks.**
   - Map old category names → new stable slugs.
   - Convert the inverted legacy `*_show_content` into explicit `available`
     booleans.
   - Split spirit multi-measures into structured price columns.
   - Respect the **venue count** decision (U11): seed one venue or two.
4. **Load.** Idempotent, deterministic `prisma db seed` (re-runnable).
5. **Verify.** Counts, ordering, per-venue visibility, and tr-present/en-ru-
   fallback. Then run the `menu-parity-check` skill.

## Guardrails
- Unknown values (e.g. missing price) → obvious flagged placeholders, never
  invented (`AGENTS.md` rules 5–6).
- Re-hosting: prefer storing product images in our own asset store, not the SaaS
  CDN (`DATA_SOURCING.md` U-data-1).

## Done when
- `prisma db seed` reproducibly builds the agreed venue(s) with correct
  categories/products/menu items and translations; parity check passes.

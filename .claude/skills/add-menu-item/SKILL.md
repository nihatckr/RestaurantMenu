---
name: add-menu-item
description: Add a dish/drink to the RestaurantMenu catalog as a Business-level Product plus per-venue MenuItem rows, keeping the Product/MenuItem responsibilities separate and adding tr/en/ru translations. Use when asked to add, create, or import a menu item, dish, drink, or product, or to put an existing product on a venue's menu.
---

# Add a menu item

Encodes the core invariant from `PRODUCT.md` + `AGENTS.md` (rules 11–12): a
**Product** is venue-independent identity; a **MenuItem** is the venue/menu-
specific join carrying price, availability, order, and category. Never blur them.

## Before you start
- Read `PRODUCT.md` (domain model) and `I18N.md` (translation model).
- Confirm which **venue(s)** the item appears in and its **category slug**.
- If a value (e.g. price) is unknown, seed a clearly-flagged placeholder — do
  **not** invent it (AGENTS rules 5–6).

## Steps
1. **Product (venue-independent).** Create/find the `Product` with intrinsic
   fields only: image, drink attributes (`tag`, `color`, measures like
   cl/glass/bottle), and language-neutral facts. No price, no visibility, no
   venue here.
2. **Translations.** Add `tr` (required) and any `en`/`ru` rows for
   title/subtitle/description via the translation model in `I18N.md`. Missing
   locales fall back to `tr`.
3. **MenuItem per venue.** For each target venue's menu, create a `MenuItem`
   linking the Product to a **Category** (by slug), with `price`, `available`,
   and `sortOrder`. One Product → many MenuItems (one per venue it appears in).
4. **No venue hard-coding.** Resolve venues/categories by slug from data; never
   branch on a venue name (AGENTS rule 10).
5. **Verify.** Run `typecheck`, `lint`, and the relevant tests. If the app is
   running, confirm the item shows in the correct venue(s)/category and is hidden
   where `available=false`.

## Done when
- One Product (no price/visibility on it) + a MenuItem per target venue.
- tr present; en/ru present-or-fallback.
- Item appears only in the intended venues/categories; quality gates pass.

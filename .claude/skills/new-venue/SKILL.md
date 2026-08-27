---
name: new-venue
description: Add a new venue (e.g. Garden or a 3rd/4th area) to RestaurantMenu using data only — a Venue record, its Menu, category ordering, and MenuItems — with no code branches on venue names. Use when asked to add a venue, area, or a second/third menu, or to prove multi-venue support.
---

# Add a venue (data-only)

Proves the `PRODUCT.md` promise and `AGENTS.md` rule 10: venues are data, not
code. Adding a venue must require **zero** `if (venue === '…')` logic.

## Steps
1. **Venue record.** Create a `Venue` with a stable `slug` (e.g. `garden`),
   display name, and its ordered set of languages/currency inherited from the
   Business. The dynamic route `/[venueSlug]` resolves it automatically.
2. **Menu + categories.** Create the venue's `Menu` and assign `Category`
   entries with per-venue `sortOrder` (ordering may differ between venues — this
   is expected, see `LEGACY_AUDIT.md`).
3. **MenuItems.** Add MenuItems for the products this venue offers (reuse the
   shared `Product` catalog; use the `add-menu-item` skill per item). Hide a
   product here by omitting its MenuItem or setting `available=false` — never by
   code.
4. **Visibility differences.** Encode any per-venue hides (e.g. legacy Terrace
   hid Breakfast) as data on this venue's MenuItems/categories, not conditionals.
5. **Verify no hard-coding.** Grep the codebase for the new slug; it must appear
   only in seed/data, never in component/logic branches.
6. **Verify runtime.** `/[newSlug]` renders from the same code paths as existing
   venues; `typecheck`/`lint`/tests pass.

## Done when
- `/[newSlug]` works with no new conditional code.
- Ordering/visibility differences live in data only.
- Quality gates pass.

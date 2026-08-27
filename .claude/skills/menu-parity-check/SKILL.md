---
name: menu-parity-check
description: Verify a RestaurantMenu venue matches the evidenced legacy behavior — shared catalog, per-venue visibility, category ordering, bilingual display — before launch. Use when asked to check legacy parity, verify a venue renders correctly, validate a migration, or sign off T10.
---

# Legacy parity check

Verifies the new app reproduces only the **evidence-backed** legacy behavior in
`LEGACY_AUDIT.md` (§ Shared/Terrace-specific/Garden-specific + live-site check).
Do not check for behavior that isn't evidenced; UNKNOWNs stay UNKNOWN.

## Checklist (per venue)
1. **Shared catalog.** Products come from one Business-level catalog; the same
   product can appear in multiple venues (via MenuItems).
2. **Per-venue visibility.** Items/categories hidden in a venue do not render;
   e.g. if the business kept it, Terrace hides Breakfast, Garden shows it. Driven
   by MenuItem `available` / omission, never by venue-name code.
3. **Category ordering.** Categories render in the venue's configured order
   (legacy Terrace vs Garden drink order differed).
4. **Item schema.** Title, subtitle, TR + EN (+RU) text, price, image or
   placeholder (never a broken image), and structured drink measures
   (cl/glass/bottle/multi-column spirits).
5. **Flow.** Landing category list → category page shows the chosen category
   first, then the rest on one scroll (PR7).
6. **i18n.** Switching locale swaps only the language; missing translations fall
   back to `tr`.

## How to verify
- Prefer runtime verification: with `next dev` running, use the Next.js MCP
  (`get_compilation_issues`) and `agent-browser` (`react tree`, network) to
  confirm the static PPR shell and rendered content; or Playwright e2e.
- Cross-check counts/ordering/visibility against the seed and `LEGACY_AUDIT.md`.

## Done when
- Every checklist item passes for each seeded venue, or any deviation is
  intentional and recorded (with a note in the PR / T10 sign-off).

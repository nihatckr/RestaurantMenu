# Agent Contract — RestaurantMenu

Rules for any coding agent (human or AI) working in `RestaurantMenu/`. These are
binding. If a task appears to require breaking one, stop and raise it instead of
proceeding.

## Source of authority
1. **`docs/PRODUCT.md` is the product authority.** It defines what the system is and
   does. Build to it.
2. **`docs/ARCHITECTURE.md` defines the technical boundaries.** Stack, allowed/denied
   dependencies, read/write paths. Stay inside them.
3. **`docs/LEGACY_AUDIT.md` is evidence only.** It records what the old apps did (and
   the 2026-08-27 live-site findings). It is a reference for behavior, never a
   template to copy code from and never an authority over
   `docs/PRODUCT.md`/`docs/ARCHITECTURE.md`.

**Supporting specs (binding within their domain):** `docs/SECURITY.md` (security),
`docs/I18N.md` (localization + affects the schema), `docs/DESIGN.md` (UI/tokens/a11y),
`docs/DATA_SOURCING.md` (seed source + cutover), `docs/OPS.md` (deploy/infra). They refine
— never override — PRODUCT/ARCHITECTURE.

## Legacy boundaries
4. **The legacy apps `TerraceMenu/` and `GardenMenu/` have been removed locally**
   (2026-08-28). Their behavior is captured in `docs/LEGACY_AUDIT.md`; the source is
   preserved only at `github.com/nihatckr/TerraceMenu` and `.../GardenMenu` for
   reference. Do not re-add them to this repo. All code lives in `RestaurantMenu/`.

## Correctness discipline
5. **Do not invent behavior.** If a requirement is not backed by `docs/PRODUCT.md` or
   evidence in `docs/LEGACY_AUDIT.md`, do not build it.
6. **Unknowns stay UNKNOWN.** If something is unproven, mark it UNKNOWN /
   ASSUMPTION and surface it — do not fill the gap with a guess turned into code.
7. **No out-of-scope refactors.** Change only what the task needs. No drive-by
   rewrites, renames, or "while I'm here" cleanups.

## Dependencies & stack
8. **Justify new dependencies before adding them.** State why the need cannot be
   met by the `docs/ARCHITECTURE.md` stack. Never add a denied dependency (GraphQL/
   Apollo/Pothos/codegen, Supabase, Redux/Zustand, styled-components, etc.).
   Legacy usage is not justification.

## Verify every change
9. **After each implementation step, run and pass:** `typecheck`, `lint`, and the
   relevant tests. Report real results; if something fails, say so with output.

## Domain invariants
10. **Never hard-code venue identity.** No `if (venue === 'terrace')`, no
    hard-coded venue slugs/ids/flags in logic. Venues, their ordering, and their
    visibility come from data. The system must accept a 3rd/4th venue with no
    code change.
11. **Preserve the shared product model.** One Business-level `Product` catalog;
    venues are views over it, not owners of products.
12. **Do not blur `Product` and `MenuItem`.**
    - `Product` = venue-independent identity (names, image, drink attributes).
    - `MenuItem` = venue/menu-specific facts (`price`, `available`,
      `sortOrder`, `categoryId`, the Product↔Menu join).
    Price/visibility/order never live on `Product`; intrinsic dish identity never
    lives on `MenuItem`.

## Security
13. **`docs/SECURITY.md` controls are binding.** Public path stays read-only and
    leak-free (no raw errors, no `dangerouslySetInnerHTML`, `next/image` host
    allowlist). Every mutation is authenticated + authorized **server-side** and
    schema-validated; no mass assignment; no raw/unsafe SQL. Secrets only via
    env — never committed, never in the client bundle. Not-yet-built features may
    only be built **together with** their `docs/SECURITY.md` controls, not before.

## Working style
- Keep Prisma access behind the thin data-access layer (`docs/ARCHITECTURE.md`); no
  `prisma.*` calls in components.
- Public reads = Server Components; mutations = Server Actions / Route Handlers.
- Prefer the smallest change that satisfies the task and its acceptance criteria.

> **Next.js 16.3 note — agent files coexist with this contract:** on 16.3+,
> `next dev` (and `create-next-app`) auto-generate/**upsert** the delimited managed
> block below (the `nextjs-agent-rules` markers), which points agents to
> version-matched docs at `node_modules/next/dist/docs/`, plus a `CLAUDE.md`
> (`@AGENTS.md`). Content **outside** the markers is preserved on update, so these
> project rules survive — keep them **above** the markers and commit the managed
> block with your work. Do NOT write the marker string anywhere except the block
> itself: the upsert regex matches the first occurrence, and a stray copy in prose
> once clobbered rules 4–13 (this is why they were restored 2026-08-28). Opt out
> only via `agentRules: false` in `next.config.ts` (kept **on**).

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

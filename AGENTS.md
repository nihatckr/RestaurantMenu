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

> **Next.js 16.3 note — agent files coexist with this contract:** on 16.3+,
> `next dev` (and `create-next-app`) auto-generate/**upsert** a delimited
> `<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

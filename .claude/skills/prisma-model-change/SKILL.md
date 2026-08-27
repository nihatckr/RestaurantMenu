---
name: prisma-model-change
description: Safely change the RestaurantMenu Prisma schema — edit schema.prisma, create a migration, regenerate the client, update the data-access layer, and verify. Use when asked to add or modify a model/field/relation, change the database schema, or create a Prisma migration.
---

# Change the Prisma schema safely

Follows `ARCHITECTURE.md` (Prisma ORM conventions) and keeps the Product/MenuItem
split intact (`AGENTS.md` rules 11–12). Prefer the `prisma/skills`
(`prisma-client-api`, `prisma-cli`) for version-correct patterns.

## Steps
1. **Edit `schema.prisma`.** Keep language-neutral fields on `Product`,
   venue/menu-specific fields (`price`, `available`, `sortOrder`, `categoryId`,
   the join) on `MenuItem`. Add integrity constraints (`@unique`, `@@unique`
   e.g. `@@unique([menuId, productId])`, `@@unique([productId, locale])`).
2. **Migrate (dev).** Run `prisma migrate dev --name <change>`. Review the
   generated SQL; migrations are forward-only and reviewed.
3. **Generate client.** Ensure the typed client is regenerated (usually part of
   migrate/dev). No manual client edits.
4. **Update data-access.** Adjust the thin data-access functions
   (`getVenueBySlug`, `getMenuForVenue`, …). Do **not** add `prisma.*` calls into
   components (ARCHITECTURE).
5. **Update seed/tests** affected by the change.
6. **Verify.** `typecheck`, `lint`, tests; optionally the Next.js MCP
   `get_compilation_issues`. In deploy, migrations run via `prisma migrate
   deploy` with the privileged role (see `OPS.md`), never from the app process.

## Guardrails
- No `$queryRawUnsafe` / string-built SQL (`SECURITY.md`).
- Prefer additive, backward-compatible migrations; pair breaking changes with a
  data-migration plan.
- Never move price/visibility/order onto `Product`, or dish identity onto
  `MenuItem`.

## Done when
- Schema + migration + client + data-access are consistent; quality gates pass;
  the Product/MenuItem responsibilities are still separated.

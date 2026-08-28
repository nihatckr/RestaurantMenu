# RestaurantMenu — Mono Terrace & Garden

A QR digital menu for Mono Hotel Antalya, rebuilt from scratch to replace two legacy
Vite/Apollo apps (`TerraceMenu/`, `GardenMenu/`). One shared product catalog serves
multiple venues, and everything about a venue (its categories, ordering, visibility)
is **data-driven** — a 3rd/4th venue can be added with data only, no code changes.

**Stack:** Next.js 16.3 (App Router, Turbopack, PPR/`cacheComponents`) · TypeScript ·
Tailwind v4 · PostgreSQL · Prisma. No GraphQL/Apollo, Supabase, Redux, or
styled-components.

## Documentation

All project docs are in **[`docs/`](docs/)** — start with:

- **[docs/JOURNEY.md](docs/JOURNEY.md)** — how the app was built: the decisions and how
  we solved them, from the beginning to the current state.
- **[docs/README.md](docs/README.md)** — the doc index (authority specs, design, ops,
  history).

The agent contract for this repo is **[AGENTS.md](AGENTS.md)** (rules any human/AI
coder must follow; it points into `docs/`).

## Getting started

```bash
# 1. Start the local Postgres (Docker), then set DATABASE_URL in .env
docker start restaurant-menu-db        # port 5433 locally

# 2. Install, migrate, seed
npm install
npm run db:deploy                      # apply migrations
npm run db:seed                        # load seed content (idempotent)

# 3. Run
npm run dev                            # http://localhost:3000
```

Content is managed via seed data (`prisma/seed.ts`, prices in
`prisma/data/prices.ts`) — there is no admin UI. After editing seed data:
`npm run db:seed` then `rm -rf .next` (to bust the `use cache` layer).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `start` | Dev server / production server |
| `npm run build` | Production build |
| `npm run typecheck` / `lint` / `test` | Gates (tsc, eslint, Vitest) |
| `npm run test:e2e` | Playwright end-to-end (393px mobile viewport) |
| `npm run db:migrate` / `db:deploy` / `db:seed` | Prisma migrate / deploy / seed |

## Status

Public menu is feature-complete on **DEMO content**. Pending the owner: real
prices/descriptions (`docs/DEMO_MENU.md` / `U5`) and executing the deploy
(`docs/DEPLOY.md`). See [docs/JOURNEY.md §7](docs/JOURNEY.md).

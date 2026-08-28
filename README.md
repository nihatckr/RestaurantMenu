# RestaurantMenu — Mono Terrace & Garden

A QR digital menu for Mono Hotel Antalya, rebuilt from scratch to replace two legacy
Vite/Apollo apps (since removed; kept at `github.com/nihatckr/TerraceMenu` &
`.../GardenMenu`). One shared product catalog serves multiple venues, and everything
about a venue (its categories, ordering, visibility) is **data-driven** — a 3rd/4th
venue can be added from the admin panel with **no code changes**.

The **single-owner admin** is built: the owner manages the whole menu (venues,
categories, products, prices, images, visibility, order) plus Settings (brand/logo,
QR codes, privacy-preserving analytics, Excel backup, trash, security) from the app
itself; the database is the content source.

**Stack:** Next.js 16.3 (App Router, Turbopack, PPR/`cacheComponents`) · TypeScript ·
Tailwind v4 · PostgreSQL · Prisma · iron-session + bcrypt (auth) · Vercel Blob +
sharp (images). No GraphQL/Apollo, Supabase, Redux, or styled-components.

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

# 2. Install, migrate, bootstrap the admin (+ a Business row)
npm install
npm run db:deploy                      # apply migrations
npm run seed:admin                     # creates the admin (ADMIN_PASSWORD, default "1234") + a Business

# 3. (optional) load ready-made DEMO menu content
npm run seed:demo                      # only populates an empty DB

# 4. Run
npm run dev                            # http://localhost:3000
```

Content is managed from the **admin panel** (log in at `/tr/login`, then build the
menu: Settings → Mekanlar to add a venue, then add categories/products inline). The
DB is the content source. `seed:demo` is optional ready-made content; the seed data
files (`prisma/data/prices.ts`, `translations.ts`) are only used by that demo seed.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `start` | Dev server / production server |
| `npm run build` | Production build |
| `npm run typecheck` / `lint` / `test` | Gates (tsc, eslint, Vitest) |
| `npm run test:e2e` | Playwright end-to-end (393px mobile viewport) |
| `npm run db:migrate` / `db:deploy` | Prisma migrate (dev) / deploy (prod) |
| `npm run seed:admin` / `seed:demo` | Bootstrap admin + Business / load DEMO content |

## Status

Public menu **and** the single-owner admin are feature-complete and tested
(typecheck · lint · Vitest · **37 Playwright e2e** green). Pending the owner
(non-code): deploy (`docs/DEPLOY.md` / `docs/YAYIN_ONCESI.md`), set
`BLOB_READ_WRITE_TOKEN`, and enter real prices/translations. See
[docs/JOURNEY.md](docs/JOURNEY.md).

# Diagrams

Visual companions to `ARCHITECTURE.md` and `JOURNEY.md`. These render automatically
on GitHub (Mermaid).

---

## 1. Data model (ERD)

The **Product / MenuItem split** is the core: `Product` holds venue-independent
identity; `MenuItem` holds venue/menu-specific facts (price, availability, order,
category). `MenuCategory` and `MenuItem` are the join rows that make venues *views*
over one shared catalog.

```mermaid
erDiagram
  Business ||--o{ Venue : "has"
  Business ||--o{ Category : "owns"
  Business ||--o{ Product : "owns (shared catalog)"

  Venue ||--o| Menu : "has one"
  Menu ||--o{ MenuCategory : "lists (visible + order)"
  Menu ||--o{ MenuItem : "contains"

  Category ||--o{ CategoryTranslation : "tr/en/ru"
  Category ||--o{ MenuCategory : "linked per menu"
  Category ||--o{ MenuItem : "groups"
  Category ||--o{ Category : "parent/children"

  Product ||--o{ ProductTranslation : "tr/en/ru"
  Product ||--o{ MenuItem : "placed on menus"

  MenuItem ||--o{ MenuItemPrice : "labelled measures"

  Product {
    string slug
    enum kind "FOOD | DRINK"
    string tag "spirit type (Viski/Rakı/…)"
    string image
    string color "drink colour chip"
    boolean dlc
  }
  MenuItem {
    decimal price "single price (null if measures)"
    boolean available "per-venue visibility"
    boolean featured "full-width card"
    int sortOrder
  }
  MenuItemPrice {
    string label "e.g. 4 CL / 35 CL / BOTTLE"
    decimal amount
  }
  MenuCategory {
    boolean visible "per-venue"
    int sortOrder "per-venue"
  }
  Category {
    string slug "English slug"
    int columns "grid override (desserts/breakfast=2)"
  }
```

**Why it matters:** adding a venue = new `Venue` + `Menu` + `MenuCategory`/`MenuItem`
rows — **data only, no code branches** (AGENTS rule 10).

---

## 2. Request & render flow

Public reads are Server Components → a thin data-access layer (`use cache`) →
Prisma → Postgres. No client data fetching, no GraphQL.

```mermaid
flowchart TD
  A["/ (root)"] --> B["/[venueSlug] landing"]
  B -->|tap a category| C["/[venueSlug]/[categorySlug]"]

  B --> DA1["listVenueCategories()"]
  B --> DA2["getVenueMenu() → JSON-LD"]
  C --> DA2

  subgraph DAL["data-access (src/lib/data/menu.ts, 'use cache')"]
    DA1
    DA2
  end

  DAL --> P[("Prisma → Postgres")]

  C --> CS["CategorySection (per category)"]
  CS -->|"image item"| MIC["MenuItemCard (food/cocktail)"]
  CS -->|"compact drink"| MIC2["MenuItemCard (beer/soft/wine)"]
  CS -->|"tag-grouped ≥2 measures"| DT["DrinkTable (aligned grid)"]
```

Unknown slugs render a static shell then a soft-404 (Cache Components pattern).

---

## 3. Card-variant decision (data-driven)

The layout for an item is chosen from **data** — never a category-name string
(AGENTS rule; see `DESIGN.md`).

```mermaid
flowchart TD
  I["MenuItem"] --> Q1{"kind == FOOD or has image?"}
  Q1 -->|yes| Q2{"kind == DRINK<br/>(i.e. cocktail)?"}
  Q2 -->|yes| C1["Portrait photo tile (5-up)"]
  Q2 -->|no| C2["Square photo card (food)"]
  Q1 -->|no| Q3{"tag-grouped &<br/>≥2 measures?"}
  Q3 -->|yes| C3["Hard-drinks price table<br/>(GLASS/BOTTLE aligned grid)"]
  Q3 -->|no| C4["Compact card<br/>(beer/soft/wine): name +<br/>measure over price"]
```

---

## 4. Typography & responsive standard

One centralized system (`src/app/globals.css`): design tokens + `.type-*` roles,
a **fluid root** (`clamp(13.5px, 11.9px + 0.45vw, 16px)`) so all rem text scales
together, and the rule **TR and EN of one thing share one font**.

```mermaid
flowchart LR
  R["html font-size: clamp(...)"] --> T1[".type-heading (Mono)"]
  R --> T2[".type-item (Inter 700)"]
  R --> T3[".type-price (Mono)"]
  R --> T4[".type-desc (Inter)"]
  R --> T5[".type-label (Mono)"]
  T1 --> U["all sizes rem → scale at the same ratio"]
  T2 --> U
  T3 --> U
  T4 --> U
  T5 --> U
```

Fonts come from legacy `theme.js` (price/cl = Mono, title/desc = Inter); see
`JOURNEY.md` §4.

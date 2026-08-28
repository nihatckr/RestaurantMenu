# Product Definition — RestaurantMenu

> Authority: this file defines **what** the product is. It is derived from
> `LEGACY_AUDIT.md` (evidence) plus the given business context. Anything not
> proven by legacy code and not given as business context is marked
> **ASSUMPTION** and must be confirmed before it drives implementation.

---

## What does the system do?
RestaurantMenu is a **read-only digital menu** that a restaurant guest opens
(typically by scanning a QR code) to browse what a specific **venue** offers. It
replaces the two forked legacy apps (Terrace, Garden) with **one** application
that serves every venue of the business from a **single shared catalog**.

No ordering, payment, cart, guest login, search, or filtering exists in the
legacy product, and none is introduced here (see *Out of MVP*).

## Who is the customer?
- **Primary user (guest):** a restaurant guest viewing the menu on their phone.
  Anonymous, no login, read-only. This is the only user with evidence in the
  legacy apps.
- **Secondary user (owner/admin):** the single owner who maintains the catalog.
  Legacy did this in an external WordPress admin; the new app **owns this** — a
  built-in single-owner admin (auth + inline CRUD + Settings) manages venues,
  categories, products, prices, images, visibility (including an optional daily
  time window per category, e.g. Breakfast 06:00–11:00) and order. **Shipped 2026-08-28**
  (Path B — `ADMIN_PLAN.md`); the DB is now the content source. The owner also sees
  **privacy-preserving analytics** (how often each venue's menu is opened via QR) in
  Settings → Analitik — aggregate counts only, no personal data.

## Domain model
The core relationship is:

```
Business ──< Venue ──< Menu ──< MenuItem >── Product
                                   │
                              Category (assignment)
```

### Business
The restaurant operator (Mono Hotel Antalya). Owns the shared **Product**
catalog and one or more **Venues**. Exactly one Business in scope for MVP.

### Venue
A physical area/context of the business (Terrace, Garden, …). A Venue has its
own URL/identity, its own **Menu**, its own category ordering, and its own
visibility choices. **Venues are not separate products** — they are views over
the shared catalog. The system **must support adding a 3rd/4th venue via data,
not code** (no `if terrace / if garden`).

### Product
A catalog entry owned at the **Business** level — a dish, drink, or menu entry
(e.g. "Mono Burger", "Aperol Spritz"). A Product holds the **venue-independent**
facts:
- names/text: `title`, optional `subtitle`, Turkish `description`, English
  `descriptionEn`
- default `image`
- drink/measure attributes evidenced in legacy data: `tag` (drink family),
  `color`, and measure fields (`cl`, `bottle`, `glass`, and the multi-measure
  price columns for spirits). *(How much of this stays on Product vs MenuItem is
  a modeling decision — see "Product vs MenuItem".)*

A Product is **not** owned by a Venue. A Product may appear in the Terrace menu,
the Garden menu, both, or neither.

### Menu
The set of items offered at **one Venue**. There is one Menu per Venue in the
evidenced model. A Menu is an ordered collection of **Categories**, each
containing **MenuItems**.

### Category
A grouping within a Menu (Starters, Salads, Pastas, Main Courses, Desserts,
Cocktails, Wines, Beer, Soft Drinks, Hard Drinks, Breakfast). Legacy keyed
categories by an English `description` string; the new model **must give
Categories stable ids/slugs** and an explicit **sort order** (order may differ
per venue — proven by Terrace vs Garden drink ordering).

### MenuItem
The **join** between a Menu/Category and a Product. It carries the
**menu-specific** facts:
- `price` (the price shown in *this* menu)
- `availability` / visibility in *this* venue (evidenced by
  `mn_show_content` / `mngarden_show_content` per-venue flags)
- `sortOrder` within its category
- `categoryId` (which category it belongs to in this menu)

This directly matches the legacy evidence: the same catalog is shown differently
per venue purely through visibility, ordering, and (potentially) price.

## How is one Product used in multiple menus?
Through **MenuItem** rows. A single Product gets a MenuItem in the Terrace menu
and another in the Garden menu. Each MenuItem independently controls that
Product's price, visibility, category, and order **in that venue**. Hiding a
Product in Terrace = its Terrace MenuItem is unavailable/absent; showing it in
Garden = its Garden MenuItem is available. This is exactly the legacy
`*_show_content` behavior, generalized so it works for N venues.

## How are Terrace and Garden separated?
By **Venue records (data)**, not by code branches. Each Venue has a slug
(`terrace`, `garden`, …) that drives a dynamic route (`/[locale]/[venueSlug]`). All
per-venue differences observed in legacy — hidden Breakfast, drink ordering,
soft-drink subsets — are expressed as **Menu/Category/MenuItem data** for that
venue, never as `if (venue === 'terrace')`.

## Which behaviors are shared?
- The browsing flow (landing category list → category detail).
- Card/product presentation and single-language display (locale from the route).
- Branding, fonts, placeholder-on-missing-image.
- The catalog of Products itself.
- Category set and item schema.

## Which information is venue/menu-specific?
- Whether a category/item is **visible** in that venue (availability).
- **Order** of categories and of items.
- **Price** *(legacy shared one backend; whether price truly varies per venue is
  **UNKNOWN** — see Assumptions. The model allows it; MVP may set it equal.)*
- Which **categories** appear (e.g. Breakfast on Garden only).

## Product vs MenuItem — responsibility split (must not be blurred)
- **Product = what the thing is** (identity, names, image, drink attributes).
  Venue-independent. Changing a Product changes it everywhere.
- **MenuItem = how/whether this Product appears in one menu** (price,
  availability, order, category). Venue-specific. Changing a MenuItem affects
  only that venue.
- **Rule:** never store price/visibility/order on Product; never store
  names/images intrinsic to the dish on MenuItem. (Enforced in `AGENTS.md`.)

## Out of MVP (not building now)
- Ordering, cart, checkout, payments.
- Guest accounts / auth for guests.
- Search and filtering (none exists in legacy).
- Product detail pages (legacy has none — single-scroll only).
- Real-time stock/quantity availability (legacy has only boolean visibility).
- Importing/mirroring the live WordPress content in real time.

## Assumptions (must be confirmed — do not build on these silently)
- **ASSUMPTION A1** Price is modeled on **MenuItem** so it *can* differ per
  venue, but for MVP the same Product may carry the same price across venues.
  (Legacy used one shared backend; per-venue price is not proven.)
- **ASSUMPTION A2** A single Business with venues Terrace and Garden is the MVP
  scope; the schema is built for N venues but only these two are seeded.
- **~~ASSUMPTION A3~~ → RESOLVED ✅ (admin shipped 2026-08-28):** the owner
  self-updates the menu via the built-in admin (auth + inline CRUD + Settings,
  T12–T14, Path B); the content source is the **DB** (seed is bootstrap/DEMO only).
  See `ADMIN_PLAN.md` / `DECISIONS.md` B.1–B.38.
- **ASSUMPTION A4** Hard Drinks and Soft Drinks become ordinary Categories in
  the unified model (legacy stored them as separate taxonomies); their
  multi-measure pricing is preserved as structured fields, not free text.
- **ASSUMPTION A5** The new app owns its **own** PostgreSQL catalog (does not
  keep calling WordPress GraphQL). **Strengthened by the 2026-08-27 live-site
  check:** the WP GraphQL catalog no longer exists and the interim SaaS
  subscription is inactive, so owning our own store is effectively required, not
  optional.
- **ASSUMPTION A6** MVP may seed a **single "Mono Terrace" menu** rather than two
  venues. The live SaaS models one menu (no Garden split), 12 categories, TRY,
  languages tr/en/ru. The N-venue model below is retained as the safe superset,
  but seeding one venue is acceptable if the business confirms Garden merged
  (see `LEGACY_AUDIT.md` **U11**).

### Facts now confirmed by the live-site check (no longer assumptions)
- Currency: **TRY** (single). Languages: **tr / en / ru** (default tr) — the menu
  renders in **one language at a time**, chosen via a route-based switcher
  (`/[locale]/…`); missing translations fall back to Turkish (`I18N.md`).
- Current category set is the 12 listed in `LEGACY_AUDIT.md` → Live Site
  Investigation (Breakfast dropped; Çerezler added).
- Categories support **order** and **parent/child hierarchy**.

Anything above the "Out of MVP" line that is **not** an ASSUMPTION is
evidence-backed. Assumptions must be resolved in the "critical questions" review
before the code they affect is written.

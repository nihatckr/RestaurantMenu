# Legacy Audit

> Scope: read-only analysis of `TerraceMenu/` and `GardenMenu/`.
> Nothing in those two folders was modified. Every claim below is backed by a
> file reference. Anything not provable from code is marked **UNKNOWN**.

---

## Executive Summary

`TerraceMenu` and `GardenMenu` are **the same application forked twice**. A
recursive diff of the two `src/` trees shows only **5 files differ**, and all
image/font/svg assets are byte-identical. Both are Vite + React 18 single-page
apps that render a QR-menu for the **Mono Hotel Antalya** restaurant, pulling
all content at runtime from a **WordPress WPGraphQL** endpoint
(`https://www.monohotelantalya.com/graphql`).

> **Update (2026-08-27) — live-site check, see "Live Site Investigation" below:**
> the legacy apps are already **out of production**. The `monomenu*` GraphQL
> types were removed from the WordPress backend, and the live menu now runs on a
> third-party SaaS (`menu1.io` / `aksungur.app`) at `menu.monohotelantalya.com`,
> whose subscription is currently **inactive**. There is **no live GraphQL data
> to import**; the current real catalog structure is captured below.

The two apps represent **two venues of one business** (Terrace and Garden). The
only real behavioral differences are: (1) the URL base path, (2) Terrace hides
the *Breakfast* category, (3) drink categories render in a different order, and
(4) each venue reads a **different per-item visibility flag**
(`mn_show_content` vs `mngarden_show_content`). This last point is the key
domain evidence: **the backend already models per-venue visibility on a shared
product/menu-item catalog.**

The code itself is heavily duplicated (≈9 near-identical "MenuItem" section
components and ≈9 near-identical "MenuCard" components), routed by hard-coded
English category strings, and hard-codes venue identity. It is not a base to
refactor; it is evidence to mine.

---

## TerraceMenu

### Stack
- **Build:** Vite `^5.0.8`, `@vitejs/plugin-react` (`vite.config.js`).
- **Framework:** React `^18.2.0` + `react-dom` (`src/main.jsx`).
- **Routing:** `react-router-dom` `^6.21.2` (`src/App.jsx`).
- **Data:** `@apollo/client` `^3.8.9` GraphQL client (`src/libs/apolloClient.js`).
- **Styling:** `styled-components` `^6.1.8` + one global CSS file (`src/styles/main.css`, `src/styles/theme.js`).
- **Animation:** `framer-motion` `^10.18.0` (nav list stagger only).
- **Icons:** `react-icons` `^5.0.1` (one arrow icon).
- **No TypeScript. No tests. No state library. No i18n library.**
- **Lint:** ESLint 8 flat-less config (`.eslintrc.cjs`), `lint` script present; `dev`/`build`/`preview` scripts standard Vite.
- **Env:** `VITE_GRAPHQL_URL=https://www.monohotelantalya.com/graphql` (`.env`).
- **Deploy:** static SPA. `public/.htaccess` rewrites all non-file requests to `index.html` (cPanel/Apache, PHP 7.3 handler present but unused by the SPA). A commented-out `lib`/UMD build block exists in `vite.config.js` (evidence the bundle was once embedded elsewhere, e.g. inside WordPress).

### Routes (`src/App.jsx`)
- `/menu` → `Layout` (Outlet wrapper).
  - index `/menu` → `Qr` (landing: logo + category navigation list).
  - `/menu/:id` → `QrMenu` (category detail; `:id` is a taxonomy term id).
  - `*` → `Error` (404).

### Components (`src/components/`)
Category **section** wrappers (map items → cards): `MenuItems`, `MenuItem`,
`MenuItemBeers`, `MenuItemWines`, `MenuItemCocktails`, `MenuItemDesserts`,
`MenuItemWraps`, `MenuItemSoft`, `MenuItemHardDrinks`.
Individual **card** renderers: `MenuCards`, `MenuCardBreakFast`, `MenuCardBeers`,
`MenuCardWines`, `MenuCardCocktails`, `MenuCardDesserts`, `MenuCardsWraps`,
`MenuCardSoft`, `MenuDrinksCard`.
Chrome: `Layout`, `Navigation` (+ `Navigation/Links`), `HeaderCenter`,
`HeaderSubCenter`, `Footer`, `Icons/Mono`, `Icons/Monoterrace`, `Styled`
(shared styled-component primitives + `Spinner`/`Loading`).

### Data (`src/libs/queries.js`)
GraphQL against WPGraphQL. Content types observed:
- **`monomenuCategories`** — food categories (taxonomy). Fields per node:
  `id, name, slug, description`, and nested `monomenus.nodes { id, slug, title,
  menu { … } }`.
- **`monoHardDrinksCategory`** — hard drinks taxonomy (query `GET_HARD`).
- **`monoSoftKategoriler`** — soft drinks taxonomy (`GET_SOFT`, `GET_SOFTMENU`).
- The `menu` field is an **array** (ACF-repeater-like) of item rows with fields:
  `title, subtitle, description, descriptionen, price, image, color, tag, dlc,
  glass, bottle, cl, fourcl, fivecl, eightcl, thirtyfivecl, fiftycl, seventycl,
  mn_show_content, mngarden_show_content`.
- **Per-venue visibility flags:** `mn_show_content` (Terrace),
  `mngarden_show_content` (Garden).

Query usage:
- `GET_SINGLEMENU(where)` — used twice in `QrMenu`: once with
  `{ termTaxonomId: id }` (the selected category) and once with `{ exclude: id }`
  (all other categories). Categories capped at `first: 20`.
- `GET_MENU` — flat category list for the nav landing (`Navigation`).
- `GET_HARD` — self-contained fetch inside `MenuItemHardDrinks`.
- `GET_SOFTMENU` — self-contained fetch inside `MenuItemSoft`.
- `GET_SOFT` — **declared but not imported anywhere** (dead).

### Product Behavior
- **Landing (`Qr`)**: shows the Mono logo (links to menu root), a vertical
  animated list of categories (`Navigation` → `Links`), and the Mono-Terrace
  wordmark. Terrace's nav **filters out the Breakfast category** by hard-coded
  id `dGVybToy` (`Navigation/index.jsx`); a commented block shows the "full
  menu" variant that would include it.
- **Category page (`QrMenu`)**: renders the selected category **first**, then
  every other category below it, so the whole menu is on one scroll. Each
  category's `description` string is matched against a hard-coded switch to pick
  a renderer (`Starters`, `Salads`, `Pastas`, `Wraps and Burgers`,
  `Maın Courses`, `Desserts`, `Cocktaıls`, `Beer`, `Wınes`, `Soft Drınks`,
  `Hard Drınks`, `Breakfast`). Note the Turkish dotless-ı typos baked into the
  matched strings. `Breakfast` → `return null` (hidden on Terrace). This switch
  is **duplicated in full** for the selected-category loop and the
  other-categories loop.
- **Food card (`MenuCards`)**: image (or a translucent pink placeholder box when
  `image === ''`), title, price, description, subtitle, English description.
- **Soft-drink section (`MenuItemSoft`)**: ignores the `monomenus` prop, runs
  its **own** `GET_SOFTMENU` query, keeps only the node whose `slug === 'terrace'`,
  then filters items by `mn_show_content === false` (i.e. the boolean is used
  inverted — `false` means "show here"). Renders compact `MenuCardSoft`
  (color-overlay chip, title, cl, price).
- **Hard-drink section (`MenuItemHardDrinks`)**: own `GET_HARD` query; groups by
  `tag` (`Tequılas`, `Lıqueurs`, `Rums`, `Rakı`, `Vermouths`, `Champaıngs`) and
  renders multi-measure price columns (4/8 cl, 35/50/70 cl, glass, etc.) via
  ad-hoc index heuristics.
- **No product detail page, no search, no filter UI, no cart, no ordering.** It
  is a read-only digital menu.
- **Language:** bilingual **content** (Turkish `title`/`subtitle` +
  `descriptionen`) rendered together; **no language switcher / i18n runtime**.
- **Price:** free-text `price` string from the CMS (currency implied; a
  `turkish-lira` svg asset exists but the cards render the raw `price` string).
- **Availability:** expressed only through the per-venue `*_show_content`
  visibility flags and category hiding — no stock/quantity concept.

### Assets (`src/assets/`)
- `png/` product photos grouped by category folder: `AnaYemek` (main courses),
  `Breakfast`, `Coctails`, `Desserts`, `Pastas`, `Salads`, `Starters`, `Wrap`.
  **~80 images total.** Filenames are human/Turkish (e.g. `Kuzu İncik.jpg`).
- `svg/`: `mono.svg`, `mono-terrace.svg`, `turkish-lira-2.svg`.
- `fonts/`: `MonoTRegular` (`.ttf`/`.woff`) — the "Mono" brand font used by the theme.
- **Note:** the bundled `png/` assets appear to be design references; runtime
  cards use the CMS `image` URL field, not these local files. (**UNKNOWN**
  whether any local asset is actually imported at runtime — none is referenced
  by the card components, which read `props.menu.image`.)

---

## GardenMenu

Structurally identical to Terrace (same stack, same files, same assets). Only
the 5 diffs below matter.

### Stack
Identical to Terrace (same `package.json`, same deps/versions, same
`vite.config.js`, same `.env` endpoint).

### Routes (`src/App.jsx`)
- `/gardenmenu`, `/gardenmenu/:id`, `*` (same shape as Terrace, different base
  path).

### Components
Identical file set to Terrace.

### Data
Same queries. **Difference:** its soft-drink filtering reads the **Garden** flag
and slug (see Product Behavior).

### Product Behavior
Same as Terrace **except**:
- Nav shows **all** categories including **Breakfast** (no `dGVybToy` filter in
  `Navigation/index.jsx`); `QrMenu` does not `return null` for Breakfast.
- Drink categories render in a **different order** (Garden: `Wınes` → `Soft
  Drınks` → `Beer`; Terrace: `Beer` → `Wınes` → `Soft Drınks`).
- `MenuItemSoft` keeps `slug === 'garden'` and filters by
  `mngarden_show_content === false`.

### Assets
Byte-identical to Terrace (only the font's Vite build-hash in `main.css`
differs, which is a build artifact, not a design change).

---

## Shared Behavior (Terrace ∩ Garden)
- Same stack, same build, same GraphQL backend and endpoint.
- Same landing → category-list → single-scroll category page flow.
- Same category taxonomy and the same `description`-string render switch.
- Same food/drink card layouts and the same `menu` field schema.
- Same brand assets, fonts, icons, spinner/loading, theme tokens.
- Same three drink data sources (`monomenuCategories`, `monoHardDrinksCategory`,
  `monoSoftKategoriler`) and the same multi-measure hard-drink pricing logic.

## Terrace-specific Behavior
- Base path `/menu`.
- **Breakfast category hidden** (nav filter on id `dGVybToy`; `null` render).
- Reads visibility flag `mn_show_content`, venue slug `'terrace'`.
- Drink order Beer → Wines → Soft.

## Garden-specific Behavior
- Base path `/gardenmenu`.
- **Breakfast category shown.**
- Reads visibility flag `mngarden_show_content`, venue slug `'garden'`.
- Drink order Wines → Soft → Beer.

## Shared Products / Data
- Both apps consume the **same catalog** from the same WordPress backend; there
  is no per-venue product data in either repo.
- All bundled product photos, categories, and the `menu` schema are identical.
- Evidence: identical asset trees + identical queries + a single shared GraphQL
  URL ⇒ **one product catalog, two venue views**.

## Divergent Products / Data
- No divergent *products* found in code. Divergence is purely **presentational /
  visibility**: which categories/items are shown, and in what order, per venue —
  driven by `mn_show_content` / `mngarden_show_content` and the Breakfast hide.

## Reusable Assets
- Brand font `MonoTRegular`, `mono.svg` / `mono-terrace.svg` wordmarks,
  `turkish-lira-2.svg`.
- ~80 categorized product reference photos (useful as seed imagery / design
  reference).
- Theme tokens (`styles/theme.js`) — typographic scale + brand greys.
- These can be **copied** into `RestaurantMenu/` (they are not code that needs
  migrating).

## Technical Debt
1. **Fork duplication** — two near-identical repos; changes must be made twice.
2. **Component explosion** — ~9 `MenuItem*` + ~9 `MenuCard*` components that are
   90% identical; differences are minor field/layout tweaks.
3. **Routing by display text** — the render switch keys off the category
   `description` string (with typos like `Maın`, `Cocktaıls`, `Wınes`). Renaming
   a category in the CMS silently breaks rendering.
4. **Duplicated switch** — `QrMenu` repeats the entire category→component switch
   twice (selected loop + rest loop).
5. **Hard-coded venue identity** — venue slug strings (`'terrace'`/`'garden'`),
   flag names, and the Breakfast id `dGVybToy` are hard-coded. Directly violates
   the "no `if terrace / if garden`" goal for the new app.
6. **Inverted/opaque flag semantics** — `*_show_content === false` means "show".
7. **Dead code** — `MenuDrinksCard` and `Footer` are never imported; `GET_SOFT`
   is declared but unused; `use-dimensions.js` has no importer.
8. **Fixed-width, non-responsive** — hard `390–430px` widths and pervasive
   `!important`; built for a fixed QR/phone frame, not fluid layouts.
9. **No i18n runtime** — bilingual content is concatenated, not toggleable.
10. **Fragile drink pricing** — hard-drink measures derived from array-index
    heuristics (`map()[2]`, `!existRaki`, etc.), extremely brittle.
11. **No tests, no types, no error boundaries** beyond inline `Error!` strings.

## Live Site Investigation (2026-08-27)
Read-only probes of the live backend and menu domain (public GraphQL + public
HTML; no writes). Findings:

- **Legacy data source is dead.** The WordPress GraphQL endpoint still responds,
  but `monomenuCategories`, `monoHardDrinksCategory`, `monoSoftKategoriler` and
  the `monomenu` post type **no longer exist** on `RootQuery`. `contentTypes`
  now returns only `post`, `page`, `attachment`. ⇒ The legacy Vite apps would
  fail against production today; **there is no live GraphQL catalog to import.**
- **Menu was already rebuilt on a SaaS.** The WP nav menu links "Menu" →
  `https://menu.monohotelantalya.com/`, which is a **Next.js app on Vercel**
  backed by a commercial digital-menu platform (`menu1.io` CDN +
  `*.aksungur.app` API). This is **not** our `RestaurantMenu` and not the legacy
  apps. Old `/menu` and `/gardenmenu` routes 404 there.
- **Current real model (from the SaaS page payload):**
  - Single customer **"Mono Terrace"**; `defaultCurrency: TRY` (currencies:
    `[TRY]`); languages `[tr, en, ru]` (default `tr`); TZ `Europe/Istanbul`.
  - `isTrialActive: false`, **`isSubscriptionActive: false`** — the SaaS
    subscription appears lapsed (plausible reason to bring the menu back
    in-house).
  - **12 categories**, each with `slug`, `image`, `order`, `parentId` (hierarchy
    supported), `status`:
    1 Başlangıçlar (`baslangiclar`), 2 Salatalar, 3 Makarnalar, 4 Sandviçler,
    5 Ana Yemekler, 6 Tatlılar, 7 Kokteyller, 8 Biralar, 9 Şaraplar,
    10 Alkollü İçecekler, 11 Soft İçecek, 12 Çerezler.
  - **No Terrace/Garden venue split** in the live data — it is modeled as **one
    menu for one customer**. **Breakfast is gone**; **Çerezler (nuts/snacks) is
    new** vs the legacy set.
  - Individual product rows load client-side from the `*.aksungur.app` API and
    were not captured here; category structure, currency, and languages are
    confirmed.

**Implications for the rebuild:**
- Seeds must come from a **fresh source** (export from the SaaS if still
  accessible, or manual entry), not the dead WP GraphQL. Resolves the *source*
  half of **U5**; the exact live product list/prices remains to be exported.
- Currency (**TRY**) and languages (**tr/en/ru**) are now **evidence**, not
  assumptions (updates U6, PR9).
- **Tension to resolve:** legacy modeled **two venues** (Terrace/Garden); the
  current live SaaS models **one menu**. The N-venue design in `PRODUCT.md` still
  holds and is the safer superset, but confirm with the business whether Garden
  is still a distinct menu or has merged into one. (New: **U11**.)

## Unknowns
- **U1** Exact WordPress/ACF schema: is `menu` an ACF repeater? Why is a
  menu-item an array under each `monomenu` node?
- **U2** True semantics of `mn_show_content` / `mngarden_show_content` (why
  `false` = visible; is it "hide" inverted?).
- **U3** Whether Hard/Soft drinks are venue-scoped at all, or global across
  venues (their queries don't filter by venue except Soft's slug check).
- **U4** Meaning of fields `dlc`, `tag`, `color`, `glass`, `bottle`, and the
  various `*cl` measures for non-drink items.
- **U5** The full live product list, prices, and images (server-driven; not in
  the repo).
- **U6** Currency/locale handling (raw `price` string; lira asset unused).
- **U7** Any admin/authoring flow — none in the repos; presumably WordPress
  admin. No auth code exists client-side.
- **U8** Whether a 3rd/4th venue was ever intended technically (business context
  says yes; code shows only two hard-coded venues).
- **U9** Whether the local bundled photos are ever used at runtime, or are
  purely design references.
- **U10** How `:id` term ids are generated/stable (base64-looking, e.g.
  `dGVybToy`).
- **U11** Is Garden still a distinct venue/menu, or has the business merged to a
  single "Mono Terrace" menu (as the live SaaS shows)? Determines whether MVP
  seeds one venue or two. (Raised by the 2026-08-27 live-site check.)
- **U12** Alcohol (beer/wine/spirits/cocktails) + allergen display: are there
  Turkish legal/regulatory constraints on showing an alcohol menu/prices, and is
  allergen disclosure required? Potential launch blocker. (See
  `DATA_SOURCING.md`.) → **RESOLVED (2026-08-27):** price-label obligations
  documented and partly implemented — see `COMPLIANCE.md` (VAT-included notice +
  no-service-charge shown in-app; physical-menu-on-request, discount display, and
  Ministry price-data filing are the business's operational duties).

## Migration Risks
- **R1** Content lives in an external WordPress that the new app must either keep
  reading or fully replace with its own PostgreSQL model + import. Cutover of the
  live catalog is the biggest risk. (**UNKNOWN** if we get a data export.)
- **R2** Category identity currently = free-text `description`. Re-modeling to
  stable ids/slugs is required but must preserve the current render intent.
- **R3** Per-venue visibility must be preserved exactly (Breakfast hidden on
  Terrace, soft-drink subsets) or the menus will visibly change.
- **R4** The multi-measure drink pricing (4/8 cl, bottle/glass, tags) is real
  product complexity that a naive `price: number` model would lose.
- **R5** ~~Bilingual content must not regress into single-language.~~
  **SUPERSEDED (2026-08-28):** the rebuild intentionally shows **one language at a
  time** via a `/[locale]` switcher (tr/en/ru) with tr fallback, instead of the
  legacy TR+EN-together concatenation. No content is lost — every language is
  reachable by URL. See `I18N.md` / `PARITY.md`.

---

## Evidence-backed Product Requirements
Only requirements provable from the legacy code are listed. No new features.

- **PR1** The system is a **read-only digital (QR) menu** for restaurant guests;
  no ordering, cart, auth, search, or filtering exists.
- **PR2** One **business** has **multiple venues**; today exactly **Terrace** and
  **Garden** exist, each with its own base URL.
- **PR3** Venues share **one product/menu catalog**; the same items/categories
  back both venues.
- **PR4** **Per-venue visibility** is a first-class concept: an item or category
  can be shown in one venue and hidden in another (Breakfast hidden on Terrace;
  soft drinks filtered per venue via `mn_show_content` / `mngarden_show_content`).
- **PR5** Menu is organized into **categories** (food taxonomy) plus dedicated
  **Hard Drinks** and **Soft Drinks** groupings.
- **PR6** A menu item carries: `title`, optional `subtitle`, a Turkish
  `description` and an English `descriptionen`, a free-text `price`, an optional
  `image`, and drink-specific measure/labelling fields (`cl`, `bottle`, `glass`,
  `color`, `tag`, and multiple `*cl` price columns).
- **PR7** Navigation flow: **landing category list → single category page that
  shows the chosen category first, then the rest** on one scroll.
- **PR8** Categories render in a **defined order**, and that order can differ per
  venue.
- **PR9** ~~Content is **bilingual** (Turkish + English) shown together.~~
  **DIVERGED (2026-08-28):** rebuild renders **one language at a time** via the
  `/[locale]` switcher (tr/en/ru), not both together — see R5 note above.
- **PR10** Branding is fixed: **Mono** wordmark, `MonoTRegular` font, per-venue
  sub-wordmark (e.g. Mono-Terrace), phone-framed layout.
- **PR11** When an item has no image, a **placeholder** is shown (never a broken
  image).

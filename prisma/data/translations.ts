// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT TRANSLATIONS — single source of the menu text in every language.
//  (I18N.md). Edit this file, then run:  npm run db:seed   (locally also
//  `rm -rf .next` so the `use cache` menu re-reads).
//
//  HOW TO FILL:
//   • `tr` is REQUIRED (the fallback). `en` / `ru` are optional.
//   • Leave a value as "" (empty) to fall back to Turkish — the app never shows
//     a blank line; an empty en/ru simply shows the Turkish text on that page.
//   • So: to make a product show up translated on /en or /ru, put the real text
//     in its `en` / `ru` slot. The blanks below (ru: "") are what still needs a
//     real Russian translation.
//   • `subtitle` and `description` are OPTIONAL. Add them to any product to show
//     a second line / a description, e.g.:
//         kalamar: {
//           title:       { tr: "Kalamar", en: "Calamari", ru: "Кальмары" },
//           description: { tr: "Limon ve …", en: "With lemon …", ru: "…" },
//         },
//   • This file is authoritative: clearing a value (→ "") on the next seed
//     removes that translation row, and Turkish fallback takes over.
//
//  STATUS (2026-08-28): titles tr ✓ / en ✓ (complete) · ru ✗ (only 4 filled,
//  49 still blank). Descriptions: none yet. Fill the "" slots with real content.
// ─────────────────────────────────────────────────────────────────────────────

export type LocalizedText = { tr: string; en?: string; ru?: string };

export type ProductText = {
  title: LocalizedText;
  subtitle?: LocalizedText;
  description?: LocalizedText;
};

export const TRANSLATIONS: Record<string, ProductText> = {
  // ── Başlangıçlar / Starters ──────────────────────────────────────────────
  kalamar: { title: { tr: "Kalamar", en: "Calamari", ru: "" } },
  falafel: { title: { tr: "Falafel", en: "Falafel", ru: "" } },
  "karisik-kizartma": { title: { tr: "Karışık Kızartma", en: "Mixed Fries", ru: "" } },
  "spring-rolls": { title: { tr: "Spring Rolls", en: "Spring Rolls", ru: "" } },

  // ── Salatalar / Salads ───────────────────────────────────────────────────
  "roka-salatasi": { title: { tr: "Roka Salatası", en: "Arugula Salad", ru: "Салат из рукколы" } },
  "mono-fit": { title: { tr: "Mono Fit", en: "Mono Fit Salad", ru: "" } },
  "tavuklu-sezar": { title: { tr: "Tavuklu Sezar Salata", en: "Chicken Caesar Salad", ru: "" } },

  // ── Makarnalar / Pastas ──────────────────────────────────────────────────
  "spagetti-bolognese": { title: { tr: "Spagetti Bolognese", en: "Spaghetti Bolognese", ru: "" } },
  "fettucini-alfredo": { title: { tr: "Fettucini Alfredo", en: "Fettuccine Alfredo", ru: "" } },
  "penne-arabiata": { title: { tr: "Penne Arabiata", en: "Penne Arrabbiata", ru: "" } },
  manti: { title: { tr: "Mantı", en: "Turkish Mantı", ru: "" } },

  // ── Sandviç & Burger / Wraps & Burgers ───────────────────────────────────
  "mono-burger": { title: { tr: "Mono Burger", en: "Mono Burger", ru: "Моно Бургер" } },
  cheeseburger: { title: { tr: "Cheeseburger", en: "Cheeseburger", ru: "" } },
  "vegan-wrap": { title: { tr: "Vegan Wrap", en: "Vegan Wrap", ru: "" } },
  "tavuklu-quesedilla": { title: { tr: "Tavuklu Quesadilla", en: "Chicken Quesadilla", ru: "" } },

  // ── Ana Yemekler / Main Courses ──────────────────────────────────────────
  "dana-antrikot": { title: { tr: "Dana Antrikot", en: "Beef Entrecôte", ru: "" } },
  "somon-izgara": { title: { tr: "Somon Izgara", en: "Grilled Salmon", ru: "" } },
  "kuzu-incik": { title: { tr: "Kuzu İncik", en: "Lamb Shank", ru: "" } },
  "cokertme-kebabi": { title: { tr: "Çökertme Kebabı", en: "Çökertme Kebab", ru: "" } },

  // ── Tatlılar / Desserts ──────────────────────────────────────────────────
  "san-sebastian": { title: { tr: "San Sebastian Cheesecake", en: "San Sebastian Cheesecake", ru: "Чизкейк Сан-Себастьян" } },
  "baileys-tiramisu": { title: { tr: "Bailey's Tiramisu", en: "Bailey's Tiramisu", ru: "" } },
  "meyve-tabagi": { title: { tr: "Meyve Tabağı", en: "Fruit Plate", ru: "" } },

  // ── Kokteyller / Cocktails ───────────────────────────────────────────────
  "aperol-spritz": { title: { tr: "Aperol Spritz", en: "Aperol Spritz", ru: "" } },
  mojito: { title: { tr: "Mojito", en: "Mojito", ru: "" } },
  negroni: { title: { tr: "Negroni", en: "Negroni", ru: "" } },
  margarita: { title: { tr: "Margarita", en: "Margarita", ru: "" } },

  // ── Biralar / Beers ──────────────────────────────────────────────────────
  "fici-bira": { title: { tr: "Fıçı Bira", en: "Draft Beer", ru: "" } },
  "sise-bira": { title: { tr: "Şişe Bira", en: "Bottled Beer", ru: "" } },

  // ── Şaraplar / Wines ─────────────────────────────────────────────────────
  "kirmizi-sarap-ev": { title: { tr: "Ev Şarabı (Kırmızı)", en: "House Wine (Red)", ru: "" } },
  "beyaz-sarap-ev": { title: { tr: "Ev Şarabı (Beyaz)", en: "House Wine (White)", ru: "" } },
  "kirmizi-sarap-sise": { title: { tr: "Kırmızı Şarap (Şişe)", en: "Red Wine (Bottle)", ru: "" } },

  // ── Alkollü İçecekler / Spirits ──────────────────────────────────────────
  "viski-standart": { title: { tr: "Viski (Standart)", en: "Whisky (Standard)", ru: "" } },
  "viski-premium": { title: { tr: "Viski (Premium)", en: "Whisky (Premium)", ru: "" } },
  "viski-single-malt": { title: { tr: "Viski (Single Malt)", en: "Whisky (Single Malt)", ru: "" } },
  raki: { title: { tr: "Rakı", en: "Rakı", ru: "" } },
  "raki-ozel": { title: { tr: "Rakı (Özel Seri)", en: "Rakı (Special)", ru: "" } },
  votka: { title: { tr: "Votka", en: "Vodka", ru: "" } },
  "votka-premium": { title: { tr: "Votka (Premium)", en: "Vodka (Premium)", ru: "" } },
  cin: { title: { tr: "Cin", en: "Gin", ru: "" } },
  "cin-premium": { title: { tr: "Cin (Premium)", en: "Gin (Premium)", ru: "" } },
  tekila: { title: { tr: "Tekila (Blanco)", en: "Tequila (Blanco)", ru: "" } },
  "tekila-anejo": { title: { tr: "Tekila (Añejo)", en: "Tequila (Añejo)", ru: "" } },
  "rom-beyaz": { title: { tr: "Rom (Beyaz)", en: "Rum (White)", ru: "" } },
  "rom-esmer": { title: { tr: "Rom (Esmer)", en: "Rum (Dark)", ru: "" } },
  konyak: { title: { tr: "Konyak", en: "Cognac", ru: "" } },
  likor: { title: { tr: "Likör", en: "Liqueur", ru: "" } },

  // ── Soft İçecekler / Soft Drinks ─────────────────────────────────────────
  kola: { title: { tr: "Kola", en: "Cola", ru: "" } },
  soda: { title: { tr: "Soda", en: "Sparkling Water", ru: "" } },
  ayran: { title: { tr: "Ayran", en: "Ayran", ru: "" } },
  su: { title: { tr: "Su", en: "Water", ru: "" } },

  // ── Kahvaltı / Breakfast ─────────────────────────────────────────────────
  "serpme-kahvalti": { title: { tr: "Serpme Kahvaltı", en: "Turkish Breakfast", ru: "Турецкий завтрак" } },
  "mono-kahvalti": { title: { tr: "Mono Kahvaltı", en: "Mono Breakfast", ru: "" } },
  pankek: { title: { tr: "Pankek", en: "Pancakes", ru: "" } },
};

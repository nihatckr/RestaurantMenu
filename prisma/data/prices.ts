// ─────────────────────────────────────────────────────────────────────────────
// DEMO PRICES (TRY) — the single place to edit menu prices.
//
// These are PLACEHOLDER/demo values pending the real list (U5). To update:
// change the numbers here and re-run `npm run db:seed`. Keys are product slugs
// (see prisma/seed.ts PRODUCTS).
//
//   number                         → single price
//   [{ label, amount }, ...]       → labelled measures (spirits by cl, wine by
//                                     glass/bottle) — legacy Hard-Drinks style
// ─────────────────────────────────────────────────────────────────────────────

export type PriceValue = number | { label: string; amount: number }[];

export const PRICES: Record<string, PriceValue> = {
  // Başlangıçlar / Starters
  kalamar: 320,
  falafel: 220,
  "karisik-kizartma": 240,
  "spring-rolls": 260,

  // Salatalar / Salads
  "roka-salatasi": 220,
  "mono-fit": 280,
  "tavuklu-sezar": 300,

  // Makarnalar / Pastas
  "spagetti-bolognese": 340,
  "fettucini-alfredo": 330,
  "penne-arabiata": 320,
  manti: 290,

  // Sandviç & Burger / Wraps & Burgers
  "mono-burger": 480,
  cheeseburger: 440,
  "vegan-wrap": 360,
  "tavuklu-quesedilla": 380,

  // Ana Yemekler / Main Courses
  "dana-antrikot": 720,
  "somon-izgara": 560,
  "kuzu-incik": 640,
  "cokertme-kebabi": 520,

  // Tatlılar / Desserts
  "san-sebastian": 260,
  "baileys-tiramisu": 240,
  "meyve-tabagi": 300,

  // Kokteyller / Cocktails
  "aperol-spritz": 420,
  mojito: 400,
  negroni: 440,
  margarita: 420,

  // Biralar / Beers (serving cl)
  "fici-bira": [{ label: "50 CL", amount: 190 }],
  "sise-bira": [{ label: "33 CL", amount: 180 }],

  // Şaraplar / Wines — BOTTLE then GLASS labels (legacy MenuCardWines: English
  // "BOTTLE"/"GLASS", bottle first).
  "kirmizi-sarap-ev": [
    { label: "BOTTLE", amount: 1100 },
    { label: "GLASS", amount: 320 },
  ],
  "beyaz-sarap-ev": [
    { label: "BOTTLE", amount: 1000 },
    { label: "GLASS", amount: 300 },
  ],
  "kirmizi-sarap-sise": [{ label: "BOTTLE", amount: 1800 }],

  // Alkollü İçecekler / Spirits (grouped by tag; multi-cl). ALL DEMO VALUES.
  // The table renders two groups (legacy MenuItemHardDrinks): a GLASS column for
  // small pours (4/5/8 CL) and a BOTTLE column for bottle sizes (35/50/70 CL, or
  // "Şişe"). Products carry various CL versions to exercise both columns.
  // Replace amounts with the real price list (U5).
  "viski-standart": [
    { label: "4 CL", amount: 340 },
    { label: "8 CL", amount: 620 },
    { label: "35 CL", amount: 2600 },
    { label: "50 CL", amount: 3600 },
    { label: "70 CL", amount: 4800 },
  ],
  "viski-premium": [
    { label: "4 CL", amount: 480 },
    { label: "8 CL", amount: 880 },
    { label: "35 CL", amount: 3600 },
    { label: "50 CL", amount: 5000 },
    { label: "70 CL", amount: 6800 },
  ],
  "viski-single-malt": [
    { label: "4 CL", amount: 620 },
    { label: "8 CL", amount: 1150 },
    { label: "70 CL", amount: 9500 },
  ],
  raki: [
    { label: "5 CL", amount: 260 },
    { label: "Şişe", amount: 1400 },
  ],
  "raki-ozel": [
    { label: "5 CL", amount: 320 },
    { label: "Şişe", amount: 1700 },
  ],
  votka: [
    { label: "4 CL", amount: 300 },
    { label: "8 CL", amount: 560 },
    { label: "35 CL", amount: 2200 },
    { label: "50 CL", amount: 3000 },
    { label: "70 CL", amount: 4200 },
  ],
  "votka-premium": [
    { label: "4 CL", amount: 460 },
    { label: "8 CL", amount: 840 },
    { label: "70 CL", amount: 6200 },
  ],
  cin: [
    { label: "4 CL", amount: 300 },
    { label: "8 CL", amount: 560 },
    { label: "35 CL", amount: 2200 },
    { label: "50 CL", amount: 3000 },
    { label: "70 CL", amount: 4200 },
  ],
  "cin-premium": [
    { label: "4 CL", amount: 480 },
    { label: "8 CL", amount: 900 },
    { label: "70 CL", amount: 6600 },
  ],
  tekila: [
    { label: "4 CL", amount: 360 },
    { label: "8 CL", amount: 660 },
    { label: "35 CL", amount: 2800 },
    { label: "50 CL", amount: 3900 },
    { label: "70 CL", amount: 5200 },
  ],
  "tekila-anejo": [
    { label: "4 CL", amount: 560 },
    { label: "8 CL", amount: 1040 },
    { label: "70 CL", amount: 7800 },
  ],
  "rom-beyaz": [
    { label: "4 CL", amount: 320 },
    { label: "8 CL", amount: 600 },
    { label: "35 CL", amount: 2400 },
    { label: "50 CL", amount: 3300 },
    { label: "70 CL", amount: 4600 },
  ],
  "rom-esmer": [
    { label: "4 CL", amount: 400 },
    { label: "8 CL", amount: 740 },
    { label: "70 CL", amount: 5600 },
  ],
  konyak: [
    { label: "4 CL", amount: 640 },
    { label: "8 CL", amount: 1180 },
    { label: "70 CL", amount: 9800 },
  ],
  likor: [
    { label: "4 CL", amount: 300 },
    { label: "8 CL", amount: 560 },
  ],

  // Soft İçecekler / Soft Drinks
  kola: 90,
  soda: 70,
  ayran: 60,
  su: 40,

  // Kahvaltı / Breakfast
  "serpme-kahvalti": 650,
  "mono-kahvalti": 480,
  pankek: 220,
};

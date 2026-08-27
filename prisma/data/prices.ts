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

  // Biralar / Beers (serving size shown, legacy `cl`)
  efes: [{ label: "33 CL", amount: 180 }],
  bomonti: [{ label: "33 CL", amount: 190 }],

  // Şaraplar / Wines — bottle then glass (legacy MenuCardWines order)
  "ev-sarabi-kirmizi": [
    { label: "Şişe", amount: 1100 },
    { label: "Kadeh", amount: 320 },
  ],
  "ev-sarabi-beyaz": [
    { label: "Şişe", amount: 1100 },
    { label: "Kadeh", amount: 320 },
  ],

  // Alkollü İçecekler / Spirits (cl / bottle)
  raki: [
    { label: "5 CL", amount: 260 },
    { label: "Şişe", amount: 1400 },
  ],
  viski: [
    { label: "4 CL", amount: 340 },
    { label: "8 CL", amount: 620 },
  ],

  // Soft İçecekler / Soft Drinks
  cola: 90,
  ayran: 60,
  su: 40,

  // Kahvaltı / Breakfast
  "serpme-kahvalti": 650,
  "mono-kahvalti": 480,
  pankek: 220,
};

// Currency/locale helpers. Business currency is TRY, default locale tr
// (confirmed by the live-site check — see LEGACY_AUDIT.md / I18N.md).

/**
 * Format a numeric amount as a menu price string. The Figma design shows plain
 * grouped numbers (no ₺ symbol) — the brand Mono font has no glyph for ₺ (it
 * renders as a .notdef box), and the whole menu is single-currency (TRY, stated
 * once in the footer "Tüm fiyatlarımıza KDV dâhildir"). tr-TR groups thousands
 * with a dot (1.400). Returns an empty string for nullish/NaN input (render a
 * placeholder instead of a broken price — cf. PR11 image placeholder behavior).
 */
export function formatPriceTRY(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "";
  // No thousands separator (design shows plain "1400", not "1.400").
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
    useGrouping: false,
  }).format(amount);
}

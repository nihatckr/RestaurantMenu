// Currency/locale helpers. Business currency is TRY, default locale tr
// (confirmed by the live-site check — see LEGACY_AUDIT.md / I18N.md).

/**
 * Format a numeric amount as a Turkish Lira price string.
 * Returns an empty string for nullish/NaN input (render a placeholder instead of
 * a broken price — cf. PR11 image placeholder behavior).
 */
export function formatPriceTRY(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

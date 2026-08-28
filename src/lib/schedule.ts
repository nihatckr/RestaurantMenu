// Category time-window (scheduled visibility) helpers. Windows are stored as
// "HH:MM" 24h strings interpreted in the venue's timezone (Europe/Istanbul).
// Comparisons are plain lexicographic — safe because the strings are zero-padded.

const TZ = "Europe/Istanbul";

/** True for a well-formed 24h "HH:MM" string (00:00–23:59). */
export function isValidHHMM(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** Current wall-clock time in Europe/Istanbul as "HH:MM". */
export function nowHHMMInIstanbul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // avoid the "24:00" midnight quirk on some ICU builds
  }).format(now);
}

/**
 * Is a category open at `nowHHMM` given its optional window? A window needs both
 * bounds; a missing/invalid/degenerate bound means "no constraint" (always open).
 * `from < to` → same-day window `[from, to)`; `from > to` → overnight window that
 * wraps past midnight (e.g. 22:00–02:00).
 */
export function isOpenAt(
  visibleFrom: string | null | undefined,
  visibleTo: string | null | undefined,
  nowHHMM: string,
): boolean {
  const from = visibleFrom && isValidHHMM(visibleFrom) ? visibleFrom : null;
  const to = visibleTo && isValidHHMM(visibleTo) ? visibleTo : null;
  if (!from || !to || from === to) return true; // no (usable) window → always open
  if (from < to) return nowHHMM >= from && nowHHMM < to; // same-day
  return nowHHMM >= from || nowHHMM < to; // overnight (wraps midnight)
}

/** "06:00–11:00" for display, or null when there is no window. */
export function formatWindow(
  from?: string | null,
  to?: string | null,
): string | null {
  if (!from || !to) return null;
  return `${from}–${to}`;
}

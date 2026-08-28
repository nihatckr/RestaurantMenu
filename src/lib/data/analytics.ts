import "server-only";
import { prisma } from "@/lib/db";

const TZ = "Europe/Istanbul";
const DAY_MS = 24 * 60 * 60 * 1000;

export type Analytics = {
  total: number;
  last7: number;
  last30: number;
  byVenue: { venueSlug: string; count: number }[];
  byDay: { label: string; count: number }[]; // last 14 days, oldest → newest
  peakHour: number | null; // 0–23 (local TZ) with the most opens in the last 30d
};

/** Aggregate menu-open counts (last 30 days + all-time total). All grouping is in
 *  the venue's timezone; no PII is stored or read. */
export async function getAnalytics(): Promise<Analytics> {
  const now = Date.now();
  const [total, rows] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.findMany({
      where: { createdAt: { gte: new Date(now - 30 * DAY_MS) } },
      select: { venueSlug: true, createdAt: true },
    }),
  ]);

  const last7 = rows.filter((r) => r.createdAt.getTime() >= now - 7 * DAY_MS).length;

  const byVenueMap = new Map<string, number>();
  for (const r of rows) {
    byVenueMap.set(r.venueSlug, (byVenueMap.get(r.venueSlug) ?? 0) + 1);
  }
  const byVenue = [...byVenueMap]
    .map(([venueSlug, count]) => ({ venueSlug, count }))
    .sort((a, b) => b.count - a.count);

  const dayFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  });
  const hourFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  });

  const dayCount = new Map<string, number>();
  const hourCount = new Array(24).fill(0);
  for (const r of rows) {
    const label = dayFmt.format(r.createdAt);
    dayCount.set(label, (dayCount.get(label) ?? 0) + 1);
    const h = parseInt(hourFmt.format(r.createdAt), 10);
    if (!Number.isNaN(h) && h >= 0 && h < 24) hourCount[h] += 1;
  }

  const byDay: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const label = dayFmt.format(new Date(now - i * DAY_MS));
    byDay.push({ label, count: dayCount.get(label) ?? 0 });
  }

  const maxHour = Math.max(...hourCount);
  const peakHour = maxHour > 0 ? hourCount.indexOf(maxHour) : null;

  return { total, last7, last30: rows.length, byVenue, byDay, peakHour };
}

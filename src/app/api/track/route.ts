import { prisma } from "@/lib/db";
import { listVenueSlugs } from "@/lib/data/menu";
import { isLocale } from "@/lib/i18n";

// Privacy-preserving menu-open beacon (no PII). Records a PageView only for a
// known venue slug + supported locale; always answers 204 (never leaks). Called
// client-side so the public menu stays static.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const venueSlug = String(body?.venueSlug ?? "").slice(0, 60);
    const locale = String(body?.locale ?? "");
    if (isLocale(locale) && venueSlug) {
      const slugs = await listVenueSlugs();
      if (slugs.includes(venueSlug)) {
        await prisma.pageView.create({ data: { venueSlug, locale } });
      }
    }
  } catch {
    // ignore — analytics must never surface an error to a guest
  }
  return new Response(null, { status: 204 });
}

import QRCode from "qrcode";
import { isAdmin } from "@/lib/auth";
import { getVenueBySlug } from "@/lib/data/menu";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE } from "@/lib/i18n";

// Admin-only QR image for a venue's public menu URL (to print on tables). Returns
// a PNG inline; the Settings page also links to it with `download` to save it.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ venueSlug: string }> },
) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { venueSlug } = await params;
  const venue = await getVenueBySlug(venueSlug);
  if (!venue) return new Response("Not found", { status: 404 });

  const url = `${SITE_URL}/${DEFAULT_LOCALE}/${venueSlug}`;
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${venueSlug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}

import { QrCode, Download } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE } from "@/lib/i18n";

// Per-venue QR codes for the public menu URL (print on tables). The image + the
// download both hit the admin-only /admin/qr/[venueSlug] route.
export function QRSection({
  venues,
}: {
  venues: { slug: string; name: string }[];
}) {
  return (
    <Card>
      <CardHeader
        icon={QrCode}
        title="QR kodları"
        description="Her mekanın menü adresi için QR kod. Masalara basmak üzere indir."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        {venues.map((v) => {
          const url = `${SITE_URL}/${DEFAULT_LOCALE}/${v.slug}`;
          return (
            <div key={v.slug} className="flex flex-col items-start gap-2">
              <h3 className="font-body text-sm">{v.name}</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/admin/qr/${v.slug}`}
                alt={`${v.name} QR kodu`}
                width={160}
                height={160}
                className="rounded border border-muted/20"
              />
              <p className="break-all font-body text-[0.6875rem] text-muted">{url}</p>
              <a
                href={`/admin/qr/${v.slug}`}
                download={`qr-${v.slug}.png`}
                className="inline-flex items-center gap-1 rounded border border-muted/40 px-2 py-1 font-body text-xs text-foreground transition-colors hover:border-foreground"
              >
                <Download size={13} aria-hidden /> İndir (PNG)
              </a>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

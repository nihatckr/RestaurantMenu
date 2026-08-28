import { getMessages } from "@/lib/messages";
import { getBusinessInfo } from "@/lib/data/settings";

// Legal price-label notice (TR Price Label Regulation / Law 6502): prices must
// be shown as tax-included, and service/table/cover charges are prohibited.
// Shown site-wide so it is easily visible; rendered in the page language so it
// reads for the current guest (COMPLIANCE.md has the full obligations). The
// owner-set contact/social row + optional extra line sit below it.
export async function MenuFooter({ locale }: { locale: string }) {
  const t = getMessages(locale);
  const { footerExtra, hours, phone, instagram, mapUrl } = await getBusinessInfo();

  const igUrl = instagram
    ? instagram.startsWith("http")
      ? instagram
      : `https://instagram.com/${instagram.replace(/^@/, "")}`
    : null;
  const linkClass = "underline transition-colors hover:text-foreground";

  const contact = [
    hours ? <span key="h">{hours}</span> : null,
    phone ? (
      <a key="p" href={`tel:${phone.replace(/\s/g, "")}`} className={linkClass}>
        {phone}
      </a>
    ) : null,
    igUrl ? (
      <a key="i" href={igUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Instagram
      </a>
    ) : null,
    mapUrl ? (
      <a key="m" href={mapUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Konum
      </a>
    ) : null,
  ].filter(Boolean);

  return (
    <footer className="mt-8 border-t border-muted/15 px-6 py-6 text-center">
      <p className="font-body text-xs text-muted">{t.footerNotice}</p>
      {footerExtra && (
        <p className="mt-1 font-body text-xs text-muted">{footerExtra}</p>
      )}
      {contact.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-body text-xs text-muted">
          {contact.map((el, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>·</span>}
              {el}
            </span>
          ))}
        </p>
      )}
    </footer>
  );
}

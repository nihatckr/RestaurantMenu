import { getMessages } from "@/lib/messages";
import { getBusinessInfo } from "@/lib/data/settings";

// Legal price-label notice (TR Price Label Regulation / Law 6502): prices must
// be shown as tax-included, and service/table/cover charges are prohibited.
// Shown site-wide so it is easily visible; rendered in the page language so it
// reads for the current guest (COMPLIANCE.md has the full obligations). An
// optional owner-set extra line (contact/address) sits below it.
export async function MenuFooter({ locale }: { locale: string }) {
  const t = getMessages(locale);
  const { footerExtra } = await getBusinessInfo();
  return (
    <footer className="mt-8 border-t border-muted/15 px-6 py-6 text-center">
      <p className="font-body text-xs text-muted">{t.footerNotice}</p>
      {footerExtra && (
        <p className="mt-1 font-body text-xs text-muted">{footerExtra}</p>
      )}
    </footer>
  );
}

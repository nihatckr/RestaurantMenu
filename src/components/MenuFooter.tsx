import { getMessages } from "@/lib/messages";

// Legal price-label notice (TR Price Label Regulation / Law 6502): prices must
// be shown as tax-included, and service/table/cover charges are prohibited.
// Shown site-wide so it is easily visible; rendered in the page language so it
// reads for the current guest (COMPLIANCE.md has the full obligations).
export function MenuFooter({ locale }: { locale: string }) {
  const t = getMessages(locale);
  return (
    <footer className="mt-8 border-t border-muted/15 px-6 py-6 text-center">
      <p className="font-body text-xs text-muted">{t.footerNotice}</p>
    </footer>
  );
}

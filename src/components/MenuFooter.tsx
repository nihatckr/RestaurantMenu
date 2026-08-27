// Legal price-label notice (TR Price Label Regulation / Law 6502): prices must
// be shown as tax-included, and service/table/cover charges are prohibited.
// Shown site-wide so it is "kolaylıkla görülebilir" (easily visible). See
// COMPLIANCE.md for the full obligations.
export function MenuFooter() {
  return (
    <footer className="mt-8 border-t border-muted/15 px-6 py-6 text-center">
      <p className="font-body text-xs text-muted">
        Tüm fiyatlarımıza KDV dâhildir · Servis ücreti alınmaz
      </p>
      <p className="font-body text-[10px] text-muted">
        All prices include VAT · No service charge
      </p>
    </footer>
  );
}

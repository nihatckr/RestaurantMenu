# Menu Price-Label Compliance (Turkey) — U12

Requirements from the Turkish **Price Label Regulation** (Fiyat Etiketi
Yönetmeliği) and **Law 6502** on Consumer Protection, incl. the update effective
**11 Oct 2025**. Sources: `ticaret.gov.tr` / `tuketici.ticaret.gov.tr`. This
resolves `LEGACY_AUDIT.md` **U12**.

> Not legal advice — confirm current obligations with the business/its advisor
> before public launch.

## Handled in the app
- **Prices in TRY, tax-included.** Prices render as plain numbers (no thousands
  separator; `formatPriceTRY`) — no `₺` symbol (the brand Mono font has no ₺ glyph);
  the
  currency + tax status is stated in the site-wide footer notice (`MenuFooter`).
  The displayed price is the final price the customer pays.
- **No service/table/cover charge.** The app adds none; the footer notice states
  tax-inclusive pricing + no service charge (servis/masa/kuver ücreti are
  prohibited by the regulation).
- **Footer notice is localized** to the page language (tr/en/ru via `messages.ts`),
  so it reads for the current guest — e.g. TR "Tüm fiyatlarımıza KDV dâhildir ·
  Servis ücreti alınmaz". A Turkish inspection views `/tr`, which shows the Turkish
  text.
- **Clear, legible names & prices**, easily visible (responsive, adequate
  contrast/size — `DESIGN.md`).

## Operational — the business must ensure (not codeable)
- **QR menu is supplementary.** A physical/printed menu must be available on
  request; the digital menu cannot be the only option.
- **Menu at entrances + tables.** Price lists must be posted at each entrance and
  on tables (physical), in addition to the QR/digital menu.
- **Discount display.** If discounts are offered, show the discounted price *and*
  the original (pre-discount) price per the regulation's look-back rule. The app
  has **no discount feature**; add one with compliant original+discounted display
  before running promotions.
- **Electronic price-data submission (from 11 Oct 2025).** Establishments meeting
  the Ministry's criteria must submit menu pricing to the Ministry electronically
  (made publicly available). Confirm whether this venue is in scope and handle the
  filing.
- **Alcohol display.** Confirm any restrictions on displaying alcoholic-beverage
  prices/menus to the relevant audience.

## If prices are NOT VAT-inclusive
The seeded demo prices are treated as VAT-inclusive (as the footer states). When
real prices are entered (`prisma/data/prices.ts`), ensure they are the
**tax-included final** amounts, or change the footer/notice accordingly.

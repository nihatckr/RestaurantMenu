import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { MenuFooter } from "@/components/MenuFooter";
import { LOCALES, isLocale } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

// Brand display font ported from the legacy apps (MonoTRegular).
const mono = localFont({
  src: [
    { path: "../fonts/MonoTRegular.woff", weight: "400", style: "normal" },
    { path: "../fonts/MonoTRegular.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-brand",
  display: "swap",
});

// Body/description font (matches legacy `theme.js` which used Inter for copy).
// Cyrillic subset so Russian menu text renders in Inter (the brand Mono font has
// no Cyrillic glyphs) at a consistent size instead of a system fallback.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mono Terrace — Menu",
  description: "Mono Terrace hotel, rooftop bar & garden menu.",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  // Large share card; the image comes from opengraph-image.tsx (og:image, which
  // Twitter falls back to when no dedicated twitter image is set).
  twitter: { card: "summary_large_image" },
};

// PWA/browser chrome colour (installable menu — app/manifest.ts). Black matches
// the brand; no visible change to the page itself.
export const viewport: Viewport = {
  themeColor: BRAND.black,
};

// Prerender one HTML shell per supported locale (I18N.md).
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Root layout, nested under [locale] so `<html lang>` matches the page language
// (Next.js internationalization guide). The whole page renders in one language;
// the locale lives in the route so pages stay static/cache-friendly per locale.
export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${mono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
        <MenuFooter locale={locale} />
      </body>
    </html>
  );
}

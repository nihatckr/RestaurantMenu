import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";

// Brand display font ported from the legacy apps (MonoTRegular).
const mono = localFont({
  src: [
    { path: "./fonts/MonoTRegular.woff", weight: "400", style: "normal" },
    { path: "./fonts/MonoTRegular.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-brand",
  display: "swap",
});

// Body/description font (matches legacy `theme.js` which used Inter for copy).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mono Terrace — Menu",
  description: "Mono Terrace hotel, rooftop bar & garden menu.",
};

// Root layout. Locale-aware `<html lang>` is set by the [locale] segment layout
// (I18N.md); this root defaults to Turkish, the business default language.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${mono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  );
}

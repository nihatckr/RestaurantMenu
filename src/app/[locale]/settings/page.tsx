import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/data/settings";
import { Spinner } from "@/components/Spinner";
import { SettingsForms } from "./SettingsForms";

// Admin-only; never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <Suspense fallback={<Spinner />}>
        <SettingsView params={params} />
      </Suspense>
    </main>
  );
}

async function SettingsView({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Reading the session makes this dynamic; guests are bounced to login.
  if (!(await isAdmin())) redirect(`/${locale}/login`);

  const settings = await getSettings();
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="type-heading text-lg">Ayarlar</h1>
        <Link
          href={`/${locale}`}
          className="font-body text-xs text-muted underline"
        >
          &lsaquo; Menüye dön
        </Link>
      </div>
      <SettingsForms logo={settings.logo} venues={settings.venues} />

      <section className="flex flex-col gap-2 border-t border-muted/20 pt-6">
        <h2 className="type-tag text-base">Yedek</h2>
        <p className="font-body text-xs text-muted">
          Tüm menüyü Excel (.xlsx) olarak indir. Kategoriler, ürünler ve mekan
          yerleşimleri ayrı sayfalarda.
        </p>
        {/* Plain <a download>: /admin/export is a file-download route handler,
            not a page — next/link would try to client-navigate/render it. */}
        <a
          href="/admin/export"
          download
          className="self-start rounded border border-muted/40 px-3 py-2 font-body text-sm text-foreground transition-colors hover:border-foreground"
        >
          Yedek indir (Excel)
        </a>
      </section>
    </>
  );
}

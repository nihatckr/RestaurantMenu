import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/data/settings";
import { Spinner } from "@/components/Spinner";
import { SettingsForms } from "./SettingsForms";
import { BackupSection } from "./BackupSection";
import { TrashSection } from "./TrashSection";
import { ActivitySection } from "./ActivitySection";

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
  const nav = [
    { href: "#marka", label: "Marka" },
    { href: "#mekanlar", label: "Mekanlar" },
    { href: "#yedek", label: "Yedek" },
    { href: "#cop", label: "Çöp kutusu" },
    { href: "#islemler", label: "İşlemler" },
  ];
  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="type-heading text-lg">Ayarlar</h1>
          <Link
            href={`/${locale}`}
            className="font-body text-xs text-muted underline"
          >
            &lsaquo; Menüye dön
          </Link>
        </div>
        {/* Quick jump between sections. */}
        <nav className="flex flex-wrap gap-2">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full border border-muted/30 px-3 py-1 font-body text-xs text-muted transition-colors hover:border-foreground hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        <SettingsForms logo={settings.logo} venues={settings.venues} />
        <BackupSection />
        <TrashSection />
        <ActivitySection />
      </div>
    </>
  );
}

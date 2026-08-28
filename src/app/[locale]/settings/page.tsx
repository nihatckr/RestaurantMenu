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
      <BackupSection />
      <TrashSection />
      <ActivitySection />
    </>
  );
}

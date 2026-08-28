import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { isAdmin, verifyPassword } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/data/settings";
import { Spinner } from "@/components/Spinner";
import { SettingsForms } from "./SettingsForms";
import { BackupSection } from "./BackupSection";
import { TrashSection } from "./TrashSection";
import { ActivitySection } from "./ActivitySection";
import { PasswordForm } from "./PasswordForm";
import { QRSection } from "./QRSection";
import { BusinessForm } from "./BusinessForm";
import { VenueManager } from "./VenueManager";
import { SettingsTabs } from "./SettingsTabs";

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

  const [settings, usingDefaultPassword] = await Promise.all([
    getSettings(),
    verifyPassword("1234"),
  ]);
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="type-heading text-lg">Ayarlar</h1>
        <Link href={`/${locale}`} className="font-body text-xs text-muted underline">
          &lsaquo; Menüye dön
        </Link>
      </div>

      {/* Security nudge: the seeded default password is still active. */}
      {usingDefaultPassword && (
        <div className="flex items-start gap-2 rounded-lg border border-mono-red/40 bg-mono-red/5 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-mono-red" aria-hidden />
          <p className="font-body text-xs text-foreground">
            Varsayılan şifre (<strong>1234</strong>) hâlâ aktif. Güvenlik için{" "}
            <strong>Güvenlik</strong> sekmesinden değiştirin.
          </p>
        </div>
      )}

      {/* Server-rendered panels handed to a client tab switcher. */}
      <SettingsTabs
        tabs={[
          { id: "marka", label: "Marka", panel: <SettingsForms logo={settings.logo} /> },
          {
            id: "mekanlar",
            label: "Mekanlar",
            panel: <VenueManager venues={settings.venues} />,
          },
          {
            id: "isletme",
            label: "İşletme",
            panel: (
              <BusinessForm name={settings.name} footerExtra={settings.footerExtra} />
            ),
          },
          { id: "qr", label: "QR kodları", panel: <QRSection venues={settings.venues} /> },
          { id: "yedek", label: "Yedek", panel: <BackupSection /> },
          { id: "cop", label: "Çöp kutusu", panel: <TrashSection /> },
          { id: "guvenlik", label: "Güvenlik", panel: <PasswordForm /> },
          { id: "islemler", label: "Son işlemler", panel: <ActivitySection /> },
        ]}
      />
    </>
  );
}

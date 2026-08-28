import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { LoginForm } from "@/components/LoginForm";
import { login } from "./actions";

// Admin surface — keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Discreet admin login — not linked from any public page (the owner bookmarks it).
// The session read (cookies()) is isolated in a Suspense boundary so it stays out of
// the static shell (cacheComponents). If already logged in, bounce to the menu — the
// owner never sits on the login screen; logout lives in the global admin bar.
export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-brand text-lg uppercase tracking-[0.2em]">Yönetim</h1>
      <Suspense fallback={<Spinner />}>
        <LoginState locale={locale} />
      </Suspense>
    </main>
  );
}

async function LoginState({ locale }: { locale: string }) {
  if (await isAdmin()) redirect(`/${locale}`);
  return <LoginForm action={login.bind(null, locale)} />;
}

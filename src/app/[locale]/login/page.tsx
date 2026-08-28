import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { LoginForm } from "@/components/LoginForm";
import { login, logout } from "./actions";

// Discreet admin login — not linked from any public page (the owner bookmarks it).
// The session read (cookies()) is isolated in a Suspense boundary so it stays out of
// the static shell (cacheComponents).
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
  if (await isAdmin()) {
    return (
      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <p className="font-body text-sm text-muted">Giriş yapıldı.</p>
        <Link href={`/${locale}`} className="font-body text-sm underline">
          Menüye git
        </Link>
        <form action={logout.bind(null, locale)}>
          <button
            type="submit"
            className="rounded border border-muted/40 px-3 py-2 font-body text-sm transition-colors hover:border-foreground"
          >
            Çıkış yap
          </button>
        </form>
      </div>
    );
  }
  return <LoginForm action={login.bind(null, locale)} />;
}

import Link from "next/link";

// 404 page (replaces the legacy inline error text).
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-brand text-xl tracking-[0.15em]">404</h1>
      <p className="font-body text-sm text-muted">Sayfa bulunamadı.</p>
      <Link href="/" className="font-body text-sm underline">
        Menüye dön
      </Link>
    </main>
  );
}

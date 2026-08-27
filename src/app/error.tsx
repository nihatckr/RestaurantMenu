"use client";

// Route error boundary. Non-leaky by design: users see a generic message, never
// the raw error/stack (SECURITY.md §4). The error is logged server-side by the
// platform; we only surface a reset action here.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-brand text-xl tracking-[0.15em]">Bir şeyler ters gitti</h1>
      <p className="font-body text-sm text-muted">
        Menü yüklenirken bir sorun oluştu.
      </p>
      <button
        onClick={reset}
        className="font-body text-sm underline"
        type="button"
      >
        Tekrar dene
      </button>
    </main>
  );
}

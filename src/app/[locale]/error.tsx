"use client";

import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";

// Route error boundary. Non-leaky by design: users see a generic message, never
// the raw error/stack (SECURITY.md §4). The error is logged server-side by the
// platform; we only surface a reset action here. Localized from the URL locale
// (client component — can't read root-params).
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = getMessages(localeFromPathname(usePathname()));
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-brand text-xl tracking-[0.15em]">{t.errorTitle}</h1>
      <p className="font-body text-sm text-muted">{t.errorBody}</p>
      <button
        onClick={reset}
        className="font-body text-sm underline"
        type="button"
      >
        {t.retry}
      </button>
    </main>
  );
}

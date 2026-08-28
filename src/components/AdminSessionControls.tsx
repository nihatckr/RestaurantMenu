import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { logout } from "@/app/[locale]/login/actions";

// Small "admin mode + settings + logout" chip for the page header (next to the
// language switcher / in the sticky bar). Renders only for a logged-in admin
// (guests get null). Session-gated → wrap the usage in a Suspense boundary so the
// static shell is unaffected.
export async function AdminSessionControls({ locale }: { locale: string }) {
  if (!(await isAdmin())) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-[0.625rem] uppercase tracking-wider text-muted">
        Yönetim
      </span>
      <Link
        href={`/${locale}/settings`}
        aria-label="Ayarlar"
        className="flex items-center gap-1 rounded border border-muted/40 px-2 py-1 font-body text-[0.625rem] uppercase tracking-wider text-foreground transition-colors hover:border-foreground"
      >
        <Settings size={12} aria-hidden /> Ayarlar
      </Link>
      <form action={logout.bind(null, locale)}>
        <button
          type="submit"
          aria-label="Çıkış yap"
          className="flex items-center gap-1 rounded border border-muted/40 px-2 py-1 font-body text-[0.625rem] uppercase tracking-wider text-foreground transition-colors hover:border-foreground"
        >
          <LogOut size={12} aria-hidden /> Çıkış
        </button>
      </form>
    </div>
  );
}

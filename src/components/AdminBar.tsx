import { isAdmin } from "@/lib/auth";
import { logout } from "@/app/[locale]/login/actions";

// Global admin affordance: shown only when the owner is logged in — an "admin mode"
// indicator + logout, reachable from any page. Guests get `null` (nothing leaks; the
// session read is isolated in a Suspense boundary in the layout, so the static public
// shell is unaffected). Bottom-left to avoid the language switcher (top) and the
// back-to-top button (bottom-right).
export async function AdminBar({ locale }: { locale: string }) {
  if (!(await isAdmin())) return null;
  return (
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-3 rounded-full border border-muted/30 bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur">
      <span className="font-body text-xs text-muted">Yönetim modu</span>
      <form action={logout.bind(null, locale)}>
        <button
          type="submit"
          className="font-body text-xs font-medium text-foreground transition-opacity hover:opacity-70"
        >
          Çıkış
        </button>
      </form>
    </div>
  );
}

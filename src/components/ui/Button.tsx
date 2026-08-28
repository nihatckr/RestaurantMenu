import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger";

// Small brand-consistent button. Plain (no client hooks) so it works in server and
// client components alike. Pass `className` to override; `cn` de-dupes conflicts.
export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const byVariant: Record<Variant, string> = {
    primary: "bg-foreground text-background hover:opacity-90",
    ghost: "border border-muted/40 text-foreground hover:border-foreground",
    danger: "border border-mono-red text-mono-red hover:bg-mono-red/10",
  };
  return (
    <button
      className={cn(
        "rounded px-3 py-2 font-body text-sm transition-colors disabled:opacity-50",
        byVariant[variant],
        className,
      )}
      {...props}
    />
  );
}

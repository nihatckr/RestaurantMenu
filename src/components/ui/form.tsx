import { cn } from "@/lib/cn";

const control =
  "w-full rounded border border-muted/40 bg-background px-3 py-2 font-body text-sm focus:border-foreground focus:outline-none";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-20 resize-y", className)} {...props} />;
}

// Label + optional error wrapper for a single form control.
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs text-muted">{label}</span>
      {children}
      {error && <span className="font-body text-xs text-mono-red">{error}</span>}
    </label>
  );
}

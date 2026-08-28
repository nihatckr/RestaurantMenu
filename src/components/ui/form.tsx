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

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, className)} {...props} />;
}

// Label + optional hint/error wrapper for a single form control.
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs text-muted">{label}</span>
      {children}
      {hint && <span className="font-body text-[0.6875rem] text-muted/80">{hint}</span>}
      {error && <span className="font-body text-xs text-mono-red">{error}</span>}
    </label>
  );
}

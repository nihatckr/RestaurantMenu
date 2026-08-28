import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

// A settings section panel: subtle bordered card with an icon + title header.
export function Card({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-4 rounded-lg border border-muted/20 bg-background p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 text-muted">
        <Icon size={18} aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5">
        <h2 className="type-tag text-base">{title}</h2>
        {description && (
          <p className="font-body text-xs text-muted">{description}</p>
        )}
      </div>
    </div>
  );
}

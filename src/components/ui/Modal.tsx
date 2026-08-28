"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

// Accessible modal on the native <dialog>: `showModal()` gives a focus-trap
// (background `inert`), ESC-to-close and a `::backdrop` for free. This thin wrapper
// adds the three things <dialog> doesn't: React open-sync (+ native focus return on
// close), backdrop-click-to-close, and a body scroll-lock while open.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className={cn(
        "m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-muted/20 bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40",
      )}
    >
      <div className="flex items-center justify-between border-b border-muted/15 px-4 py-3">
        <h2 className="font-brand text-sm uppercase tracking-[0.15em]">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="text-muted transition-colors hover:text-foreground"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}

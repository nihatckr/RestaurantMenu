"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

// Up/down reorder controls: two tiny forms bound to server actions, disabled at
// the edges. Shared by category, product and venue reordering.
export function ReorderButtons({
  label,
  upAction,
  downAction,
  canUp,
  canDown,
  size = 16,
}: {
  label: string; // for aria: `${label} yukarı/aşağı taşı`
  upAction: () => Promise<void>;
  downAction: () => Promise<void>;
  canUp: boolean;
  canDown: boolean;
  size?: number;
}) {
  const cls =
    "text-muted transition-colors hover:text-foreground disabled:opacity-30";
  return (
    <>
      <form action={upAction} className="flex">
        <button type="submit" disabled={!canUp} aria-label={`${label} yukarı taşı`} className={cls}>
          <ChevronUp size={size} aria-hidden />
        </button>
      </form>
      <form action={downAction} className="flex">
        <button type="submit" disabled={!canDown} aria-label={`${label} aşağı taşı`} className={cls}>
          <ChevronDown size={size} aria-hidden />
        </button>
      </form>
    </>
  );
}

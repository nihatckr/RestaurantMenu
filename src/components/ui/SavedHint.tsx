import { Check } from "lucide-react";

// Inline "saved" confirmation shown next to a form's submit button.
export function SavedHint({ label = "Kaydedildi" }: { label?: string }) {
  return (
    <span className="flex items-center gap-1 font-body text-xs text-muted">
      <Check size={13} aria-hidden /> {label}
    </span>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// Shared danger-confirm dialog: a title, a message (children), and a danger
// confirm button that runs `onConfirm` (a bound server action), then closes and
// refreshes. Replaces the per-feature delete/empty confirm modals.
export function ConfirmModal({
  title,
  confirmLabel = "Sil",
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Modal open onClose={onClose} title={title}>
      <div className="mb-4 font-body text-sm">{children}</div>
      <form
        action={async () => {
          await onConfirm();
          onClose();
          router.refresh();
        }}
        className="flex justify-end gap-2"
      >
        <Button type="button" variant="ghost" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit" variant="danger">
          {confirmLabel}
        </Button>
      </form>
    </Modal>
  );
}

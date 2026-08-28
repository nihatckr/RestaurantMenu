"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { emptyTrashAction } from "./settings-actions";

// Permanently empty the trash — irreversible, so it goes through a confirm modal.
export function EmptyTrashButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="danger"
        className="flex items-center gap-1 self-start text-xs"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={14} aria-hidden /> Çöp kutusunu boşalt
      </Button>
      {open && (
        <ConfirmModal
          title="Çöp kutusu boşaltılsın mı?"
          confirmLabel="Kalıcı olarak sil"
          onConfirm={emptyTrashAction}
          onClose={() => setOpen(false)}
        >
          Silinen tüm kategori ve ürünler <strong>kalıcı olarak</strong> silinecek. Bu
          işlem geri alınamaz.
        </ConfirmModal>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { emptyTrashAction } from "./settings-actions";

// Permanently empty the trash — irreversible, so it goes through a confirm modal.
export function EmptyTrashButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
        <Modal open onClose={() => setOpen(false)} title="Çöp kutusu boşaltılsın mı?">
          <p className="mb-4 font-body text-sm">
            Silinen tüm kategori ve ürünler <strong>kalıcı olarak</strong> silinecek.
            Bu işlem geri alınamaz.
          </p>
          <form
            action={async () => {
              await emptyTrashAction();
              setOpen(false);
              router.refresh();
            }}
            className="flex justify-end gap-2"
          >
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="danger">
              Kalıcı olarak sil
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

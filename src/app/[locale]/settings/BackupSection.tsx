"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { importBackupAction } from "./settings-actions";

export function BackupSection() {
  const [state, formAction, pending] = useActionState(importBackupAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <Card id="yedek" className="flex flex-col gap-4">
      <CardHeader
        icon={Download}
        title="Yedek"
        description="Tüm menüyü Excel (.xlsx) olarak indir; düzenleyip geri yükle. Kategoriler, ürünler ve mekan yerleşimleri ayrı sayfalarda."
      />
      <div>
        {/* Plain <a download>: /admin/export is a file-download route handler. */}
        <a
          href="/admin/export"
          download
          className="inline-flex items-center gap-2 rounded border border-muted/40 px-3 py-2 font-body text-sm text-foreground transition-colors hover:border-foreground"
        >
          <Download size={14} aria-hidden /> Yedek indir (Excel)
        </a>
      </div>

      <form action={formAction} className="flex flex-col items-start gap-2 border-t border-muted/15 pt-4">
        <span className="font-body text-xs text-muted">
          Yedeği içe aktar (mevcut kayıtlar slug ile güncellenir; silme yapılmaz)
        </span>
        <input
          type="file"
          name="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="font-body text-sm file:mr-3 file:rounded file:border file:border-muted/40 file:bg-background file:px-3 file:py-1.5 file:font-body file:text-sm"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "İçe aktarılıyor…" : "Yedeği içe aktar"}
        </Button>

        {state.ok && state.counts && (
          <p className="flex items-center gap-1 font-body text-xs text-foreground">
            <Check size={13} aria-hidden /> İçe aktarıldı: {state.counts.categories}{" "}
            kategori, {state.counts.products} ürün, {state.counts.items} yerleşim.
          </p>
        )}
        {state.error && (
          <p className="font-body text-xs text-mono-red">{state.error}</p>
        )}
        {state.errors && state.errors.length > 0 && (
          <ul className="flex list-disc flex-col gap-0.5 pl-4 font-body text-xs text-mono-red">
            {state.errors.slice(0, 20).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {state.errors.length > 20 && <li>… ve {state.errors.length - 20} tane daha</li>}
          </ul>
        )}
      </form>
    </Card>
  );
}

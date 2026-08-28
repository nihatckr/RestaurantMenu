import { History } from "lucide-react";
import {
  getRecentAudit,
  type AuditAction,
  type AuditEntity,
} from "@/lib/data/audit";
import { Card, CardHeader } from "@/components/ui/Card";

// Exhaustive label maps — typing them by the union forces a Turkish label for
// every audit action/entity (adding one without a label is a compile error).
const ACTIONS: Record<AuditAction, string> = {
  create: "oluşturuldu",
  update: "güncellendi",
  delete: "silindi",
  restore: "geri alındı",
  import: "içe aktarıldı",
  settings: "değiştirildi",
};
const ENTITIES: Record<AuditEntity, string> = {
  category: "Kategori",
  product: "Ürün",
  brand: "Marka logosu",
  wordmark: "Wordmark",
  backup: "Yedek",
  trash: "Çöp kutusu",
  password: "Şifre",
  business: "İşletme",
  venue: "Mekan",
};

// Recent admin activity (audit trail). Server-rendered, read-only.
export async function ActivitySection() {
  const rows = await getRecentAudit();
  if (rows.length === 0) return null;
  return (
    <Card id="islemler">
      <CardHeader
        icon={History}
        title="Son işlemler"
        description="Menüde yapılan son değişiklikler."
      />
      <ul className="flex flex-col">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-baseline justify-between gap-3 py-1 font-body text-sm"
          >
            <span>
              {ENTITIES[r.entity as AuditEntity] ?? r.entity}{" "}
              {ACTIONS[r.action as AuditAction] ?? r.action}
              {r.detail ? <span className="text-muted"> — {r.detail}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-muted">
              {new Date(r.createdAt).toLocaleString("tr-TR")}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

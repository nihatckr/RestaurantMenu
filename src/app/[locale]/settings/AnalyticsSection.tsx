import { BarChart3 } from "lucide-react";
import { getAnalytics } from "@/lib/data/analytics";
import { Card, CardHeader } from "@/components/ui/Card";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="font-brand text-2xl">{value}</span>
      <span className="font-body text-xs text-muted">{label}</span>
    </div>
  );
}

// Menu-open analytics (privacy-preserving). Server-rendered, read-only.
export async function AnalyticsSection() {
  const a = await getAnalytics();
  const maxDay = Math.max(1, ...a.byDay.map((d) => d.count));

  return (
    <Card>
      <CardHeader
        icon={BarChart3}
        title="Analitik"
        description="Menünün QR ile kaç kez açıldığı. Kişisel veri toplanmaz."
      />
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-8">
          <Stat label="Toplam açılış" value={a.total} />
          <Stat label="Son 7 gün" value={a.last7} />
          <Stat label="Son 30 gün" value={a.last30} />
          <Stat
            label="Yoğun saat"
            value={a.peakHour != null ? `${String(a.peakHour).padStart(2, "0")}:00` : "—"}
          />
        </div>

        {a.byVenue.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="font-body text-sm text-muted">Mekana göre (30 gün)</h3>
            <ul className="flex flex-col">
              {a.byVenue.map((v) => (
                <li key={v.venueSlug} className="flex justify-between font-body text-sm">
                  <span>/{v.venueSlug}</span>
                  <span className="text-muted">{v.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h3 className="font-body text-sm text-muted">Son 14 gün</h3>
          <div className="flex flex-col gap-1">
            {a.byDay.map((d) => (
              <div key={d.label} className="flex items-center gap-2 font-body text-xs">
                <span className="w-12 shrink-0 text-muted">{d.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-muted/10">
                  <div
                    className="h-2 rounded bg-foreground"
                    style={{ width: `${(d.count / maxDay) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-muted">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { Building2 } from "lucide-react";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SavedHint } from "@/components/ui/SavedHint";
import { useRefreshingAction } from "@/lib/useRefreshingAction";
import { updateBusinessInfoAction } from "./settings-actions";
import type { BusinessInfo } from "@/lib/data/settings";

export function BusinessForm({ business }: { business: BusinessInfo }) {
  const [state, formAction, pending] = useRefreshingAction(updateBusinessInfoAction, {});

  return (
    <Card>
      <CardHeader
        icon={Building2}
        title="İşletme"
        description="İşletme adı + menünün altında görünecek iletişim bilgileri (saatler, telefon, Instagram, konum) ve isteğe bağlı ek satır."
      />
      <form action={formAction} className="flex max-w-md flex-col gap-3">
        <Field label="İşletme adı">
          <Input name="name" defaultValue={business.name} required />
        </Field>
        <Field
          label="Footer ek notu (opsiyonel)"
          hint="Yasal “KDV dâhildir” bildiriminin altında görünür. Yasal bildirim sabittir, değişmez."
        >
          <Input
            name="footerExtra"
            defaultValue={business.footerExtra ?? ""}
            placeholder="Örn. Rezervasyon: 0242 000 00 00"
          />
        </Field>
        <Field label="Çalışma saatleri (opsiyonel)">
          <Input
            name="hours"
            defaultValue={business.hours ?? ""}
            placeholder="Örn. Her gün 08:00–24:00"
          />
        </Field>
        <Field label="Telefon (opsiyonel)">
          <Input name="phone" defaultValue={business.phone ?? ""} placeholder="0242 000 00 00" />
        </Field>
        <Field label="Instagram (opsiyonel)" hint="Kullanıcı adı ya da tam bağlantı.">
          <Input name="instagram" defaultValue={business.instagram ?? ""} placeholder="@monohotel" />
        </Field>
        <Field label="Konum bağlantısı (opsiyonel)" hint="Google Haritalar bağlantısı.">
          <Input name="mapUrl" defaultValue={business.mapUrl ?? ""} placeholder="https://maps.google.com/…" />
        </Field>
        {state.error && (
          <p className="font-body text-xs text-mono-red">{state.error}</p>
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
          {state.ok && !pending && <SavedHint />}
        </div>
      </form>
    </Card>
  );
}

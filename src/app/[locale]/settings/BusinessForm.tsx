"use client";

import { Building2 } from "lucide-react";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SavedHint } from "@/components/ui/SavedHint";
import { useRefreshingAction } from "@/lib/useRefreshingAction";
import { updateBusinessInfoAction } from "./settings-actions";

export function BusinessForm({
  name,
  footerExtra,
}: {
  name: string;
  footerExtra: string | null;
}) {
  const [state, formAction, pending] = useRefreshingAction(updateBusinessInfoAction, {});

  return (
    <Card>
      <CardHeader
        icon={Building2}
        title="İşletme"
        description="İşletme adı ve menünün altında görünecek isteğe bağlı bir ek satır (iletişim/adres)."
      />
      <form action={formAction} className="flex max-w-md flex-col gap-3">
        <Field label="İşletme adı">
          <Input name="name" defaultValue={name} required />
        </Field>
        <Field
          label="Footer ek notu (opsiyonel)"
          hint="Yasal “KDV dâhildir” bildiriminin altında görünür (örn. telefon/adres). Yasal bildirim sabittir, değişmez."
        >
          <Input
            name="footerExtra"
            defaultValue={footerExtra ?? ""}
            placeholder="Örn. Rezervasyon: 0242 000 00 00"
          />
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

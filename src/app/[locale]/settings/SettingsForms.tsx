"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Store, Check } from "lucide-react";
import { ImageField } from "@/components/ui/ImageField";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  updateBrandLogoAction,
  updateVenueWordmarkAction,
  type SettingsFormState,
} from "./settings-actions";

function ImageUploadForm({
  action,
  initial,
  label,
}: {
  action: (prev: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  initial: string | null;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <ImageField name="image" initial={initial} label={label} />
      {state.error && (
        <p className="font-body text-xs text-mono-red">{state.error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
        {state.ok && !pending && (
          <span className="flex items-center gap-1 font-body text-xs text-muted">
            <Check size={13} aria-hidden /> Kaydedildi
          </span>
        )}
      </div>
    </form>
  );
}

export function SettingsForms({
  logo,
  venues,
}: {
  logo: string | null;
  venues: { slug: string; name: string; wordmark: string | null }[];
}) {
  return (
    <>
      <Card id="marka">
        <CardHeader
          icon={ImageIcon}
          title="Marka logosu"
          description="Menünün üstünde ve favicon’da görünen marka işareti. Boş bırakılırsa varsayılan Mono işareti kullanılır."
        />
        <ImageUploadForm
          action={updateBrandLogoAction}
          initial={logo}
          label="Marka logosu"
        />
      </Card>

      <Card id="mekanlar">
        <CardHeader
          icon={Store}
          title="Mekan wordmark’ları"
          description="Her mekanın alt kısmında görünen wordmark. Boşsa marka işareti kullanılır."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {venues.map((v) => (
            <div key={v.slug} className="flex flex-col gap-1">
              <h3 className="font-body text-sm">{v.name}</h3>
              <ImageUploadForm
                action={updateVenueWordmarkAction.bind(null, v.slug)}
                initial={v.wordmark}
                label={`${v.name} wordmark`}
              />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

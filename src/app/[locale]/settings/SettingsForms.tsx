"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageField } from "@/components/ui/ImageField";
import { Button } from "@/components/ui/Button";
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
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
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
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h2 className="type-tag text-base">Marka logosu</h2>
        <p className="font-body text-xs text-muted">
          Menünün üstünde görünen marka işareti. Boş bırakılırsa varsayılan Mono
          işareti kullanılır.
        </p>
        <ImageUploadForm
          action={updateBrandLogoAction}
          initial={logo}
          label="Marka logosu"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-tag text-base">Mekan wordmark’ları</h2>
        <p className="font-body text-xs text-muted">
          Her mekanın alt kısmında görünen wordmark. Boşsa marka işareti kullanılır.
        </p>
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
      </section>
    </div>
  );
}

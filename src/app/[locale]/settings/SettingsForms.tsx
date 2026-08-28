"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { ImageField } from "@/components/ui/ImageField";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SavedHint } from "@/components/ui/SavedHint";
import { updateBrandLogoAction, type SettingsFormState } from "./settings-actions";

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
        {state.ok && !pending && <SavedHint />}
      </div>
    </form>
  );
}

export function SettingsForms({ logo }: { logo: string | null }) {
  return (
    <Card id="marka">
      <CardHeader
        icon={ImageIcon}
        title="Marka logosu"
        description="Menünün üstünde ve favicon’da görünen marka işareti. Boş bırakılırsa varsayılan Mono işareti kullanılır. (Mekan wordmark’ları “Mekanlar” sekmesinde.)"
      />
      <ImageUploadForm action={updateBrandLogoAction} initial={logo} label="Marka logosu" />
    </Card>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRound, Check } from "lucide-react";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { changeUsernameAction } from "./settings-actions";

export function UsernameForm({ currentUsername }: { currentUsername: string }) {
  const [state, formAction, pending] = useActionState(changeUsernameAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <Card>
      <CardHeader
        icon={UserRound}
        title="Kullanıcı adı"
        description="Girişte kullanılan kullanıcı adı."
      />
      <form action={formAction} className="flex max-w-sm flex-col gap-3">
        <Field label="Kullanıcı adı" hint="En az 3 karakter — harf, rakam, . _ -">
          <Input
            name="username"
            defaultValue={currentUsername}
            autoComplete="username"
            required
          />
        </Field>
        {state.error && (
          <p className="font-body text-xs text-mono-red">{state.error}</p>
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kullanıcı adını kaydet"}
          </Button>
          {state.ok && !pending && (
            <span className="flex items-center gap-1 font-body text-xs text-muted">
              <Check size={13} aria-hidden /> Kaydedildi
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

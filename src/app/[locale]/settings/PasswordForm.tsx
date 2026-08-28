"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, Check } from "lucide-react";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { changePasswordAction } from "./settings-actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader
        icon={KeyRound}
        title="Şifre"
        description="Yönetim paneline giriş şifresini değiştir. Mevcut şifreni doğrulaman gerekir."
      />
      <form ref={ref} action={formAction} className="flex max-w-sm flex-col gap-3">
        <Field label="Mevcut şifre">
          <Input name="current" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="Yeni şifre" hint="En az 4 karakter.">
          <Input name="next" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Yeni şifre (tekrar)">
          <Input name="confirm" type="password" autoComplete="new-password" required />
        </Field>
        {state.error && (
          <p className="font-body text-xs text-mono-red">{state.error}</p>
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Şifreyi değiştir"}
          </Button>
          {state.ok && !pending && (
            <span className="flex items-center gap-1 font-body text-xs text-muted">
              <Check size={13} aria-hidden /> Şifre değiştirildi
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

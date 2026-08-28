"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";

type LoginState = { error?: string };
type Action = (prev: LoginState, formData: FormData) => Promise<LoginState>;

// Admin login (username + password). Admin chrome is Turkish (the owner's
// language), separate from the tr/en/ru public switcher.
export function LoginForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <Field label="Kullanıcı adı">
        <Input name="username" autoComplete="username" defaultValue="admin" required />
      </Field>
      {/* Manual label (htmlFor) so the toggle button stays OUTSIDE the label — it
          must not pollute the password input's accessible name, and its aria-label
          avoids the word "Şifre" so `getByLabel("Şifre")` stays unambiguous. */}
      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="font-body text-xs text-muted">
          Şifre
        </label>
        <div className="relative">
          <Input
            id="login-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            autoFocus
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Gizle" : "Göster"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition-colors hover:text-foreground"
          >
            {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="font-body text-xs text-mono-red">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1 flex items-center justify-center gap-2">
        <LogIn size={15} aria-hidden />
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}

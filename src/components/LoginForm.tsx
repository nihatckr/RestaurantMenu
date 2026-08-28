"use client";

import { useActionState } from "react";

type LoginState = { error?: string };
type Action = (prev: LoginState, formData: FormData) => Promise<LoginState>;

// Admin login form (single password). Admin chrome is Turkish (the owner's
// language), separate from the tr/en/ru public switcher.
export function LoginForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-body text-sm text-muted">Şifre</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          className="rounded border border-muted/40 bg-background px-3 py-2 font-body text-sm focus:border-foreground focus:outline-none"
        />
      </label>
      {state.error && (
        <p role="alert" className="font-body text-xs text-mono-red">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-3 py-2 font-body text-sm text-background transition-opacity disabled:opacity-50"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş"}
      </button>
    </form>
  );
}

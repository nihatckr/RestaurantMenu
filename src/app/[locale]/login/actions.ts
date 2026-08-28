"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import {
  getSession,
  verifyPassword,
  loginLocked,
  recordLoginFail,
  resetLoginFails,
} from "@/lib/auth";

export type LoginState = { error?: string };

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

// Bound with the locale in the page: `login.bind(null, locale)` → (prev, formData).
export async function login(
  locale: string,
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const key = await clientKey();
  if (loginLocked(key)) {
    return { error: "Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin." };
  }
  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password))) {
    recordLoginFail(key);
    return { error: "Şifre hatalı." };
  }
  resetLoginFails(key);
  const session = await getSession();
  session.isAdmin = true;
  await session.save();
  redirect(`/${loc}`);
}

// Bound with the locale: `logout.bind(null, locale)` → used as a <form action>.
export async function logout(locale: string): Promise<void> {
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const session = await getSession();
  session.destroy();
  redirect(`/${loc}/login`);
}

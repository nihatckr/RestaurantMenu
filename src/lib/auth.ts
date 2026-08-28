import "server-only";
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Single-admin (owner) auth — ADMIN_PLAN.md §3. One password, hashed in env
// (`ADMIN_PASSWORD_HASH`), verified with bcrypt; the session is an encrypted,
// httpOnly cookie via iron-session (`SESSION_SECRET`). No users table, no email.
//
// NOTE: reading the session calls `cookies()`, which makes the caller dynamic — so
// only read it from the login route or from admin-only dynamic islands (kept out of
// the static public shell; T13 uses a Suspense island).

export type AdminSession = { isAdmin?: boolean };

const COOKIE_NAME = "mono_admin";

function sessionOptions() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and be at least 32 characters.");
  }
  return {
    password,
    cookieName: COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      // Secure in production (HTTPS). `AUTH_ALLOW_HTTP=1` disables it for local
      // `next start` testing over http://localhost (never set in production).
      secure:
        process.env.NODE_ENV === "production" &&
        process.env.AUTH_ALLOW_HTTP !== "1",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    },
  };
}

export async function getSession(): Promise<IronSession<AdminSession>> {
  return getIronSession<AdminSession>(await cookies(), sessionOptions());
}

/** True when the current request has a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  return (await getSession()).isAdmin === true;
}

/** Guard for admin mutations — throws if the caller isn't an authenticated admin.
 *  Every write server action calls this first (never trusts the client/UI). */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

/** Verify a submitted password against the bcrypt hash stored in the DB (seeded by
 *  `prisma/auth.seed.ts`). Single admin, so the first (only) AdminUser row is used. */
export async function verifyPassword(input: string): Promise<boolean> {
  if (!input) return false;
  const admin = await prisma.adminUser.findFirst({ select: { passwordHash: true } });
  if (!admin) return false;
  return bcrypt.compare(input, admin.passwordHash);
}

/** Verify username + password for login (single admin, looked up by username). */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  if (!username || !password) return false;
  const admin = await prisma.adminUser.findUnique({
    where: { username: username.trim() },
    select: { passwordHash: true },
  });
  if (!admin) return false;
  return bcrypt.compare(password, admin.passwordHash);
}

/** The admin's current username (for the Settings form). */
export async function getAdminUsername(): Promise<string> {
  const admin = await prisma.adminUser.findFirst({ select: { username: true } });
  return admin?.username ?? "admin";
}

/** Change the admin username (single admin row). */
export async function setUsername(newUsername: string): Promise<void> {
  const admin = await prisma.adminUser.findFirst({ select: { id: true } });
  if (!admin) throw new Error("Admin bulunamadı.");
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { username: newUsername.trim() },
  });
}

/** Set (bcrypt-hash) the admin password. Single admin: updates the one row, or
 *  creates it if missing. Callers must be authenticated + have verified current. */
export async function setPassword(newPassword: string): Promise<void> {
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  const admin = await prisma.adminUser.findFirst({ select: { id: true } });
  if (admin) {
    await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
  } else {
    await prisma.adminUser.create({ data: { passwordHash } });
  }
}

// Best-effort in-process login throttle (single admin). Distributed rate-limiting
// across serverless instances is deferred to Upstash if ever needed (ADMIN_PLAN §4/§4b).
const FAILS = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes

export function loginLocked(key: string): boolean {
  const rec = FAILS.get(key);
  return !!rec && rec.until > Date.now();
}
export function recordLoginFail(key: string): void {
  const now = Date.now();
  const rec = FAILS.get(key) ?? { count: 0, until: 0 };
  rec.count += 1;
  if (rec.count >= MAX_FAILS) rec.until = now + LOCK_MS;
  FAILS.set(key, rec);
}
export function resetLoginFails(key: string): void {
  FAILS.delete(key);
}

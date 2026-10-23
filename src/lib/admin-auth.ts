import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const adminCookieName = "ovyro_admin_session";
const sessionDurationSeconds = 60 * 60 * 12;

export type WorkspaceSession = { email: string; expiresAt: number; teamAccountId?: string };

export function hasAdminConfiguration() {
  return Boolean(process.env.OVYRO_ADMIN_EMAIL && process.env.OVYRO_ADMIN_PASSWORD_HASH && process.env.OVYRO_SESSION_SECRET);
}

function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.OVYRO_ADMIN_EMAIL?.trim().toLowerCase();
  const hashSetting = process.env.OVYRO_ADMIN_PASSWORD_HASH ?? "";
  if (!adminEmail || !hashSetting || !process.env.OVYRO_SESSION_SECRET) return false;
  if (email.trim().toLowerCase() !== adminEmail) return false;
  const [saltHex, expectedHex] = hashSetting.split(":");
  if (!/^[0-9a-f]{32}$/i.test(saltHex ?? "") || !/^[0-9a-f]{128}$/i.test(expectedHex ?? "")) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return safeEqual(actual, expected);
}

export function createAdminSession(email: string, teamAccountId?: string) {
  const secret = process.env.OVYRO_SESSION_SECRET;
  if (!secret) throw new Error("Admin session secret is not configured");
  const session: WorkspaceSession = { email: email.trim().toLowerCase(), expiresAt: Math.floor(Date.now() / 1000) + sessionDurationSeconds, ...(teamAccountId ? { teamAccountId } : {}) };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { token: `${payload}.${signature}`, maxAge: sessionDurationSeconds };
}

export function readWorkspaceSession(token?: string): WorkspaceSession | undefined {
  const secret = process.env.OVYRO_SESSION_SECRET;
  if (!token || !secret) return undefined;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return undefined;
  const expected = createHmac("sha256", secret).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, "base64url"); } catch { return undefined; }
  if (!safeEqual(actual, expected)) return undefined;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as WorkspaceSession;
    if (typeof session.email !== "string" || !Number.isFinite(session.expiresAt) || session.expiresAt <= Math.floor(Date.now() / 1000)) return undefined;
    return session;
  } catch { return undefined; }
}

export function isValidAdminSession(token?: string) {
  const session = readWorkspaceSession(token);
  return Boolean(session && !session.teamAccountId && session.email === process.env.OVYRO_ADMIN_EMAIL?.trim().toLowerCase());
}

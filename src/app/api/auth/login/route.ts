import { NextResponse } from "next/server";
import { adminCookieName, createAdminSession, hasAdminConfiguration, verifyAdminCredentials } from "@/lib/admin-auth";
import { findTeamAccountByEmail, getDatabaseUrl, verifyTeamPassword } from "@/lib/team-db";

export async function POST(request: Request) {
  if (!hasAdminConfiguration()) return NextResponse.json({ error: "Admin sign-in is not configured on this deployment." }, { status: 503 });
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter your email and password." }, { status: 400 }); }
  if (typeof body.email !== "string" || typeof body.password !== "string" || body.password.length > 1024) {
    return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
  }
  let teamAccountId: string | undefined;
  if (!verifyAdminCredentials(body.email, body.password)) {
    if (!getDatabaseUrl()) return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
    try {
      const account = await findTeamAccountByEmail(body.email);
      if (!account || !verifyTeamPassword(body.password, String(account.password_hash))) return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
      teamAccountId = String(account.id);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown database error";
      console.error("Team sign-in database lookup failed:", detail);
      return NextResponse.json({ error: "Team sign-in is temporarily unavailable. Check the database connection." }, { status: 503 });
    }
  }
  const session = createAdminSession(body.email, teamAccountId);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, session.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: session.maxAge });
  return response;
}

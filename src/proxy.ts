import { NextRequest, NextResponse } from "next/server";
import { adminCookieName, isValidAdminSession, readWorkspaceSession } from "@/lib/admin-auth";
import { findTeamAccountById } from "@/lib/team-db";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth/");
  if (isAuthApi) return NextResponse.next();

  const token = request.cookies.get(adminCookieName)?.value;
  const session = readWorkspaceSession(token);
  let authenticated = isValidAdminSession(token);
  if (!authenticated && session?.teamAccountId && process.env.DATABASE_URL) {
    try { const account = await findTeamAccountById(session.teamAccountId); authenticated = Boolean(account && account.email.toLowerCase() === session.email); }
    catch { authenticated = false; }
  }
  if (isLoginPage && authenticated) return NextResponse.redirect(new URL("/", request.url));
  if (isLoginPage) return NextResponse.next();
  if (!authenticated) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

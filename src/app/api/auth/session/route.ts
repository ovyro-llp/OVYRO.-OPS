import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, isValidAdminSession, readWorkspaceSession } from "@/lib/admin-auth";
import { findTeamAccountById } from "@/lib/team-db";

export async function GET() {
  const jar = await cookies();
  const session = readWorkspaceSession(jar.get(adminCookieName)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isValidAdminSession(jar.get(adminCookieName)?.value)) return NextResponse.json({ kind: "owner", email: session.email });
  if (!session.teamAccountId || !process.env.DATABASE_URL) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    const account = await findTeamAccountById(session.teamAccountId);
    if (!account || account.email.toLowerCase() !== session.email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    return NextResponse.json({ kind: "team", ...account });
  } catch { return NextResponse.json({ error: "Account lookup unavailable." }, { status: 503 }); }
}

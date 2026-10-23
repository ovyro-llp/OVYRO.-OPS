import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isWorkspaceOwner } from "@/lib/owner-auth";
import { createTeamAccount, listTeamAccounts } from "@/lib/team-db";

const validTabs = new Set(["Overview", "Clients", "Onboarding", "Lead pipeline", "Client content", "Resources"]);
function validInput(value: Record<string, unknown>, creating: boolean) {
  return typeof value.name === "string" && value.name.trim().length > 0 && typeof value.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) && typeof value.role === "string" && value.role.trim().length > 0 && Array.isArray(value.clientIds) && value.clientIds.every(item => typeof item === "string") && Array.isArray(value.tabs) && value.tabs.every(item => typeof item === "string" && validTabs.has(item)) && (!creating || (typeof value.password === "string" && value.password.length >= 12));
}

export async function GET() {
  if (!await isWorkspaceOwner()) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  try { return NextResponse.json({ members: await listTeamAccounts() }); }
  catch { return NextResponse.json({ error: "Team accounts require a working DATABASE_URL." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!await isWorkspaceOwner()) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!validInput(input, true)) return NextResponse.json({ error: "Enter a name, valid email, role, client scope, tabs, and a password of at least 12 characters." }, { status: 400 });
  try {
    const member = await createTeamAccount({ id: randomUUID(), name: input.name as string, email: input.email as string, password: input.password as string, role: input.role as string, clientIds: input.clientIds as string[], tabs: input.tabs as string[] });
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not create the account. Check the database connection." }, { status: 503 });
  }
}

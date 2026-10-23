import { NextResponse } from "next/server";
import { isWorkspaceOwner } from "@/lib/owner-auth";
import { deleteTeamAccount, updateTeamAccount } from "@/lib/team-db";

const validTabs = new Set(["Overview", "Clients", "Onboarding", "Lead pipeline", "Client content", "Resources"]);
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await isWorkspaceOwner()) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.name !== "string" || !body.name.trim() || typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || typeof body.role !== "string" || !body.role.trim() || !Array.isArray(body.clientIds) || !body.clientIds.every(x=>typeof x==="string") || !Array.isArray(body.tabs) || !body.tabs.every(x=>typeof x==="string"&&validTabs.has(x)) || (body.password !== undefined && (typeof body.password !== "string" || body.password.length < 12))) return NextResponse.json({ error: "Check the member details and use a password of at least 12 characters when changing it." }, { status: 400 });
  try {
    const { id } = await context.params;
    const member = await updateTeamAccount(id, { name: body.name, email: body.email, role: body.role, clientIds: body.clientIds as string[], tabs: body.tabs as string[], ...(body.password ? { password: body.password as string } : {}) });
    return member ? NextResponse.json({ member }) : NextResponse.json({ error: "Member not found." }, { status: 404 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not update the account." }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!await isWorkspaceOwner()) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const { id } = await context.params;
  try { return await deleteTeamAccount(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Member not found." }, { status: 404 }); }
  catch { return NextResponse.json({ error: "Could not remove the account." }, { status: 503 }); }
}

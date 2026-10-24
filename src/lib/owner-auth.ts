import { cookies } from "next/headers";
import { adminCookieName, isValidAdminSession, readWorkspaceSession } from "@/lib/admin-auth";
import { findTeamAccountById, getDatabaseUrl } from "@/lib/team-db";

export type TeamManagementAccess = { kind: "owner" } | { kind: "team"; memberId: string; clientIds: string[]; tabs: string[] };

export async function getTeamManagementAccess(): Promise<TeamManagementAccess | null> {
  const jar = await cookies();
  const token = jar.get(adminCookieName)?.value;
  if (isValidAdminSession(token)) return { kind: "owner" };
  const session = readWorkspaceSession(token);
  if (!session?.teamAccountId || !getDatabaseUrl()) return null;
  try {
    const account = await findTeamAccountById(session.teamAccountId);
    if (!account || account.email.toLowerCase() !== session.email || !account.tabs.includes("Team & access")) return null;
    return { kind: "team", memberId: account.id, clientIds: account.clientIds, tabs: account.tabs };
  } catch { return null; }
}

export function scopeAllows(access: TeamManagementAccess, clientIds: string[], tabs: string[]) {
  return access.kind === "owner" || (clientIds.every(id => access.clientIds.includes(id)) && tabs.every(tab => access.tabs.includes(tab)));
}

export function mayManageAccount(access: TeamManagementAccess, account: { id: string; clientIds: string[]; tabs: string[] }) {
  return access.kind === "owner" || (account.id !== access.memberId && scopeAllows(access, account.clientIds, account.tabs));
}

export async function isWorkspaceOwner() {
  const jar = await cookies();
  return isValidAdminSession(jar.get(adminCookieName)?.value);
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, isValidAdminSession, readWorkspaceSession } from "@/lib/admin-auth";
import { findTeamAccountById, getDatabaseUrl, getWorkspaceState, initializeWorkspaceState, updateWorkspaceState } from "@/lib/team-db";

type TeamScope = { clientIds: string[]; tabs: string[] };
type WorkspaceSnapshot = Record<string, unknown>;
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.filter(item => item && typeof item === "object") as Record<string, unknown>[] : [];
const arrayValues = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const stable = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize) : item && typeof item === "object" ? Object.fromEntries(Object.entries(item).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, normalize(child)])) : item;
  return JSON.stringify(normalize(value));
};

function itemKey(collection: string, item: unknown, index: number) {
  if (typeof item !== "object" || item === null) return String(item);
  const row = item as Record<string, unknown>;
  if (collection === "leads") return `${String(row.company)}|${String(row.name)}`;
  if (collection === "tasks") return String(row.id ?? `${row.client}|${row.title}|${row.due}`);
  if (collection === "roleRows") return String(row.name ?? index).toLowerCase();
  return String(row.id ?? row.name ?? row.title ?? index);
}

function mergeArrayDelta(currentValue: unknown, baseValue: unknown, incomingValue: unknown, collection: string) {
  const current = arrayValues(currentValue), base = arrayValues(baseValue), incoming = arrayValues(incomingValue);
  if (stable(base) === stable(incoming)) return current;
  const keyOf = (item: unknown, index: number) => itemKey(collection, item, index);
  const baseMap = new Map(base.map((item, index) => [keyOf(item, index), item]));
  const incomingMap = new Map(incoming.map((item, index) => [keyOf(item, index), item]));
  const merged = new Map(current.map((item, index) => [keyOf(item, index), item]));
  for (const key of baseMap.keys()) if (!incomingMap.has(key)) merged.delete(key);
  for (const [key, item] of incomingMap) {
    if (!baseMap.has(key) || stable(baseMap.get(key)) !== stable(item)) merged.set(key, item);
  }
  const orderedKeys = incoming.map(keyOf).filter(key => merged.has(key));
  const seen = new Set(orderedKeys);
  return [...orderedKeys.map(key => merged.get(key)), ...Array.from(merged.entries()).filter(([key]) => !seen.has(key)).map(([, value]) => value)];
}

function mergeSnapshotDelta(current: WorkspaceSnapshot, base: WorkspaceSnapshot, incoming: WorkspaceSnapshot): WorkspaceSnapshot {
  const next = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (stable(base[key]) === stable(value)) continue;
    next[key] = Array.isArray(value) && Array.isArray(base[key])
      ? mergeArrayDelta(current[key], base[key], value, key)
      : value;
  }
  return next;
}

function filterForTeam(state: WorkspaceSnapshot, scope: TeamScope): WorkspaceSnapshot {
  const clientIds = new Set(scope.clientIds);
  const clients = rows(state.clients).filter(client => clientIds.has(String(client.id)));
  const clientNames = new Set(clients.map(client => String(client.name)));
  const tabs = new Set(scope.tabs);
  const { members: _members, roleRows: _roleRows, ...sharedState } = state;
  return {
    ...sharedState,
    clients,
    tasks: rows(state.tasks).filter(task => clientNames.has(String(task.client))),
    leads: tabs.has("Lead pipeline") ? rows(state.leads) : [],
    contentCards: rows(state.contentCards).filter(card => clientIds.has(String(card.clientId))),
    resources: rows(state.resources).filter(resource => resource.scope === "Company" || clientIds.has(String(resource.clientId))),
    ...(tabs.has("Team & access") ? { roleRows: rows(state.roleRows) } : {}),
  };
}

function mergeTeamSnapshot(current: WorkspaceSnapshot, base: WorkspaceSnapshot, incoming: WorkspaceSnapshot, scope: TeamScope): WorkspaceSnapshot {
  const clientIds = new Set(scope.clientIds);
  const oldClients = rows(current.clients);
  const incomingClients = rows(incoming.clients).filter(client => clientIds.has(String(client.id)));
  const clientNames = new Set([...oldClients.filter(client => clientIds.has(String(client.id))), ...incomingClients].map(client => String(client.name)));
  const tabs = new Set(scope.tabs);
  const merged: WorkspaceSnapshot = {
    ...current,
    clients: mergeArrayDelta(oldClients.filter(client => clientIds.has(String(client.id))), rows(base.clients), incomingClients, "clients"),
    tasks: mergeArrayDelta(rows(current.tasks).filter(task => clientNames.has(String(task.client))), rows(base.tasks), rows(incoming.tasks), "tasks"),
    contentCards: mergeArrayDelta(rows(current.contentCards).filter(card => clientIds.has(String(card.clientId))), rows(base.contentCards), rows(incoming.contentCards), "contentCards"),
  };
  merged.clients = [...oldClients.filter(client => !clientIds.has(String(client.id))), ...rows(merged.clients)];
  merged.tasks = [...rows(current.tasks).filter(task => !clientNames.has(String(task.client))), ...rows(merged.tasks)];
  merged.contentCards = [...rows(current.contentCards).filter(card => !clientIds.has(String(card.clientId))), ...rows(merged.contentCards)];
  if (tabs.has("Lead pipeline")) merged.leads = mergeArrayDelta(current.leads, base.leads, incoming.leads, "leads");
  if (tabs.has("Lead pipeline") && Array.isArray(incoming.leadStages)) merged.leadStages = mergeArrayDelta(current.leadStages, base.leadStages, incoming.leadStages, "leadStages");
  if (tabs.has("Settings")) {
    if (Array.isArray(incoming.onboardingSections)) merged.onboardingSections = mergeArrayDelta(current.onboardingSections, base.onboardingSections, incoming.onboardingSections, "onboardingSections");
    if (Array.isArray(incoming.onboardingWorkflow)) merged.onboardingWorkflow = mergeArrayDelta(current.onboardingWorkflow, base.onboardingWorkflow, incoming.onboardingWorkflow, "onboardingWorkflow");
    if (incoming.workspaceProfile && typeof incoming.workspaceProfile === "object" && stable(base.workspaceProfile) !== stable(incoming.workspaceProfile)) merged.workspaceProfile = incoming.workspaceProfile;
  }
  if (tabs.has("Team & access")) {
    const priorRoles = new Map(rows(current.roleRows).map(role => [String(role.name).toLowerCase(), role]));
    merged.roleRows = rows(incoming.roleRows).flatMap(role => {
      const requestedTabs = Array.isArray(role.tabs) ? role.tabs.map(String) : [];
      const existing = priorRoles.get(String(role.name).toLowerCase());
      if (requestedTabs.every(tab => tabs.has(tab))) return [role];
      return existing ? [existing] : [];
    });
  }
  if (tabs.has("Resources")) merged.resources = [...rows(current.resources).filter(resource => resource.scope === "Company" || !clientIds.has(String(resource.clientId))), ...rows(mergeArrayDelta(rows(current.resources).filter(resource => resource.scope === "Client" && clientIds.has(String(resource.clientId))), rows(base.resources).filter(resource => resource.scope === "Client"), rows(incoming.resources).filter(resource => resource.scope === "Client"), "resources"))];
  return merged;
}

async function resolveIdentity() {
  const jar = await cookies();
  const token = jar.get(adminCookieName)?.value;
  const session = readWorkspaceSession(token);
  if (!session) return null;
  if (isValidAdminSession(token)) return { kind: "owner" as const };
  if (!session.teamAccountId || !getDatabaseUrl()) return null;
  const account = await findTeamAccountById(session.teamAccountId);
  if (!account || account.email.toLowerCase() !== session.email) return null;
  return { kind: "team" as const, scope: { clientIds: account.clientIds, tabs: account.tabs } };
}

export async function GET() {
  try {
    const identity = await resolveIdentity();
    if (!identity) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const state = await getWorkspaceState();
    return NextResponse.json({ state: state && identity.kind === "team" ? filterForTeam(state, identity.scope) : state });
  } catch { return NextResponse.json({ error: "Workspace database is unavailable." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  try {
    const identity = await resolveIdentity();
    if (!identity) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const body = await request.json() as { state?: unknown; baseState?: unknown; initializeOnly?: boolean };
    if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) return NextResponse.json({ error: "Invalid workspace snapshot." }, { status: 400 });
    const snapshot = body.state as WorkspaceSnapshot;
    if (JSON.stringify(snapshot).length > 12_000_000) return NextResponse.json({ error: "Workspace snapshot is too large." }, { status: 413 });
    if (body.initializeOnly && identity.kind === "owner") {
      const state = await initializeWorkspaceState(snapshot);
      return NextResponse.json({ state });
    }
    if (!body.baseState || typeof body.baseState !== "object" || Array.isArray(body.baseState)) return NextResponse.json({ error: "A server snapshot is required before saving workspace changes." }, { status: 409 });
    const base = body.baseState as WorkspaceSnapshot;
    if (identity.kind === "owner") {
      const state = await updateWorkspaceState(current => mergeSnapshotDelta(current, base, snapshot));
      return state ? NextResponse.json({ state }) : NextResponse.json({ error: "Workspace data has not been initialized." }, { status: 409 });
    }
    const state = await updateWorkspaceState(current => mergeTeamSnapshot(current, base, snapshot, identity.scope));
    return state ? NextResponse.json({ state: filterForTeam(state, identity.scope) }) : NextResponse.json({ error: "Workspace data has not been initialized by an owner." }, { status: 409 });
  } catch { return NextResponse.json({ error: "Could not save workspace data." }, { status: 503 }); }
}

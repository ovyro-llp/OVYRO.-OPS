import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, isValidAdminSession, readWorkspaceSession } from "@/lib/admin-auth";
import { findTeamAccountById, getDatabaseUrl, getWorkspaceState, initializeWorkspaceState, replaceWorkspaceState, updateWorkspaceState } from "@/lib/team-db";

type TeamScope = { clientIds: string[]; tabs: string[] };
type WorkspaceSnapshot = Record<string, unknown>;
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.filter(item => item && typeof item === "object") as Record<string, unknown>[] : [];

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

function mergeTeamSnapshot(current: WorkspaceSnapshot, incoming: WorkspaceSnapshot, scope: TeamScope): WorkspaceSnapshot {
  const clientIds = new Set(scope.clientIds);
  const oldClients = rows(current.clients);
  const incomingClients = rows(incoming.clients).filter(client => clientIds.has(String(client.id)));
  const incomingById = new Map(incomingClients.map(client => [String(client.id), client]));
  const scopedOld = oldClients.filter(client => clientIds.has(String(client.id)));
  const newClients = oldClients.map(client => incomingById.get(String(client.id)) ?? client);
  const clientNames = new Set([...scopedOld, ...incomingClients].map(client => String(client.name)));
  const tabs = new Set(scope.tabs);
  const merged: WorkspaceSnapshot = {
    ...current,
    clients: newClients,
    tasks: [...rows(current.tasks).filter(task => !clientNames.has(String(task.client))), ...rows(incoming.tasks).filter(task => clientNames.has(String(task.client)))],
    contentCards: [...rows(current.contentCards).filter(card => !clientIds.has(String(card.clientId))), ...rows(incoming.contentCards).filter(card => clientIds.has(String(card.clientId)))],
  };
  if (tabs.has("Lead pipeline")) merged.leads = rows(incoming.leads);
  if (tabs.has("Lead pipeline") && Array.isArray(incoming.leadStages) && incoming.leadStages.length) merged.leadStages = incoming.leadStages;
  if (tabs.has("Settings")) {
    if (Array.isArray(incoming.onboardingSections) && incoming.onboardingSections.length) merged.onboardingSections = incoming.onboardingSections;
    if (Array.isArray(incoming.onboardingWorkflow)) merged.onboardingWorkflow = incoming.onboardingWorkflow;
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
  if (tabs.has("Resources")) merged.resources = [...rows(current.resources).filter(resource => resource.scope === "Company" || !clientIds.has(String(resource.clientId))), ...rows(incoming.resources).filter(resource => resource.scope === "Client" && clientIds.has(String(resource.clientId)))];
  return merged;
}

function mergeLocalSnapshot(current: WorkspaceSnapshot, incoming: WorkspaceSnapshot): WorkspaceSnapshot {
  const existingClients = rows(current.clients);
  const knownClients = new Map(existingClients.map(client => [String(client.id), client]));
  const remappedClientIds = new Map<string, string>();
  const extraClients: Record<string, unknown>[] = [];
  for (const client of rows(incoming.clients)) {
    const id = String(client.id);
    const existing = knownClients.get(id);
    if (!existing) { knownClients.set(id, client); extraClients.push(client); continue; }
    if (String(existing.name) === String(client.name)) continue;
    const suffix = String(client.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "imported";
    let nextId = `${id}-import-${suffix}`;
    let counter = 2;
    while (knownClients.has(nextId)) nextId = `${id}-import-${suffix}-${counter++}`;
    const imported = { ...client, id: nextId };
    remappedClientIds.set(id, nextId);
    knownClients.set(nextId, imported);
    extraClients.push(imported);
  }
  const mergeRows = (baseValue: unknown, extraValue: unknown, keyOf: (row: Record<string, unknown>) => string) => {
    const base = rows(baseValue);
    const seen = new Set(base.map(keyOf));
    for (const row of rows(extraValue)) { const key = keyOf(row); if (!seen.has(key)) { base.push(row); seen.add(key); } }
    return base;
  };
  return {
    ...current,
    clients: [...existingClients, ...extraClients],
    tasks: mergeRows(current.tasks, incoming.tasks, row => String(row.id ?? `${row.client}|${row.title}|${row.due}`)),
    leads: mergeRows(current.leads, incoming.leads, row => `${row.company}|${row.name}`),
    leadStages: Array.isArray(incoming.leadStages) && incoming.leadStages.length ? incoming.leadStages : current.leadStages,
    onboardingSections: Array.isArray(incoming.onboardingSections) && incoming.onboardingSections.length ? incoming.onboardingSections : current.onboardingSections,
    onboardingWorkflow: Array.isArray(incoming.onboardingWorkflow) ? incoming.onboardingWorkflow : current.onboardingWorkflow,
    roleRows: mergeRows(current.roleRows, incoming.roleRows, row => String(row.name).toLowerCase()),
    resources: mergeRows(current.resources, rows(incoming.resources).map(resource => ({ ...resource, ...(remappedClientIds.has(String(resource.clientId)) ? { clientId: remappedClientIds.get(String(resource.clientId)) } : {}) })), row => String(row.id ?? `${row.title}|${row.url}`)),
    contentCards: mergeRows(current.contentCards, rows(incoming.contentCards).map(card => ({ ...card, ...(remappedClientIds.has(String(card.clientId)) ? { clientId: remappedClientIds.get(String(card.clientId)) } : {}) })), row => String(row.id ?? `${row.clientId}|${row.title}`)),
  };
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
    const body = await request.json() as { state?: unknown; initializeOnly?: boolean; mergeLocal?: boolean };
    if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) return NextResponse.json({ error: "Invalid workspace snapshot." }, { status: 400 });
    const snapshot = body.state as WorkspaceSnapshot;
    if (JSON.stringify(snapshot).length > 12_000_000) return NextResponse.json({ error: "Workspace snapshot is too large." }, { status: 413 });
    if (identity.kind === "owner") {
      if (body.mergeLocal) {
        const merged = await updateWorkspaceState(current => mergeLocalSnapshot(current, snapshot));
        const state = merged ?? await initializeWorkspaceState(snapshot);
        return NextResponse.json({ state });
      }
      const state = body.initializeOnly ? await initializeWorkspaceState(snapshot) : await replaceWorkspaceState(snapshot);
      return NextResponse.json({ state });
    }
    const state = await updateWorkspaceState(current => mergeTeamSnapshot(current, snapshot, identity.scope));
    return state ? NextResponse.json({ state: filterForTeam(state, identity.scope) }) : NextResponse.json({ error: "Workspace data has not been initialized by an owner." }, { status: 409 });
  } catch { return NextResponse.json({ error: "Could not save workspace data." }, { status: 503 }); }
}

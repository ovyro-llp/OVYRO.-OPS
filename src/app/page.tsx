"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Client = { id: string; name: string; offer: string; status: string; retainer: number; currency: string; initials: string; tone: string; owner: string; started: string };
type Task = { id: string; title: string; client: string; owner: string; due: string; status: string; section: string };
type Lead = { name: string; company: string; value: number; stage: string; source: string; initials: string; tone: string };
type TeamMember = { id: string; name: string; email: string; role: string; scope: string; clientIds?: string[]; tabs?: string[]; status: string; initials: string; tone: string };
type WorkspaceRole = { name: string; access: string; users: string; tabs: string[] };
type WorkspaceIdentity = { kind: "owner" | "team"; email: string; name?: string; role?: string; clientIds?: string[]; tabs?: string[] };
type DeleteTarget = { kind: "client" | "member" | "lead" | "role"; id: string; name: string };
type Resource = { id: string; title: string; description: string; scope: "Company" | "Client"; clientId: string; audience: string; url: string; fileName: string; fileData: string; updated: string };
type ContentCard = { id: string; clientId: string; title: string; platform: string; format: string; status: string; copy: string; assetUrl: string; updated: string };
type WorkflowStep = { id: string; title: string; section: string; enabled: boolean };

const seedClients: Client[] = [
  { id: "OV-024", name: "Northstar Dental", offer: "Full-funnel patient acquisition", status: "Active", retainer: 4800, currency: "INR", initials: "ND", tone: "mint", owner: "Maya Chen", started: "Oct 08, 2026" },
  { id: "OV-023", name: "Lumen Wellness", offer: "Growth & performance", status: "Onboarding", retainer: 3600, currency: "INR", initials: "LW", tone: "lilac", owner: "Aarav Mehta", started: "Oct 15, 2026" },
  { id: "OV-022", name: "Arc & Alder", offer: "Brand demand engine", status: "Active", retainer: 5200, currency: "INR", initials: "AA", tone: "peach", owner: "Maya Chen", started: "Sep 28, 2026" },
  { id: "OV-021", name: "Forma Skin Studio", offer: "Lead generation system", status: "Active", retainer: 2900, currency: "INR", initials: "FS", tone: "blue", owner: "Jonah Lee", started: "Sep 17, 2026" },
  { id: "OV-020", name: "Goodwell Clinics", offer: "Multi-location growth", status: "Active", retainer: 4100, currency: "INR", initials: "GC", tone: "lime", owner: "Aarav Mehta", started: "Sep 05, 2026" },
  { id: "OV-019", name: "Cloudline Finance", offer: "Creative testing", status: "Paused", retainer: 2400, currency: "INR", initials: "CF", tone: "rose", owner: "Jonah Lee", started: "Aug 21, 2026" },
];
const seedTasks: Task[] = [
  { id: "t1", title: "Send prerequisite document", client: "Lumen Wellness", owner: "Aarav Mehta", due: "Today", status: "In progress", section: "Client access" },
  { id: "t2", title: "Request Meta & Google Ads access", client: "Lumen Wellness", owner: "Aarav Mehta", due: "Today", status: "Waiting on client", section: "Client access" },
  { id: "t3", title: "Complete client survey", client: "Lumen Wellness", owner: "Client", due: "Oct 24", status: "Waiting on client", section: "Client intake" },
  { id: "t4", title: "Prepare customized foundational copy", client: "Lumen Wellness", owner: "Maya Chen", due: "Oct 27", status: "To do", section: "Copy & strategy" },
  { id: "t5", title: "Review foundational copy", client: "Lumen Wellness", owner: "Client", due: "Oct 28", status: "To do", section: "Client review" },
  { id: "t6", title: "Write 14 ad creative scripts", client: "Northstar Dental", owner: "Jonah Lee", due: "Oct 24", status: "In progress", section: "Creative production" },
  { id: "t7", title: "Draft VSL script & landing page copy", client: "Arc & Alder", owner: "Maya Chen", due: "Oct 27", status: "Review", section: "Copy & strategy" },
  { id: "t8", title: "Connect domain to GoHighLevel funnel", client: "Forma Skin Studio", owner: "Jonah Lee", due: "Oct 29", status: "To do", section: "Landing Page Development" },
  { id: "t9", title: "Install Meta Pixel & test events", client: "Goodwell Clinics", owner: "Aarav Mehta", due: "Oct 30", status: "To do", section: "Landing Page Development" },
  { id: "t10", title: "Set up WhatsApp automation & templates", client: "Goodwell Clinics", owner: "Jonah Lee", due: "Nov 02", status: "To do", section: "Landing Page Development" },
];
const seedLeads: Lead[] = [
  { name: "Olivia Parker", company: "Parker Aesthetics", value: 4800, stage: "New Lead", source: "Referral", initials: "OP", tone: "peach" },
  { name: "Marcus Hill", company: "Hill Dental Group", value: 6200, stage: "Contacted", source: "LinkedIn", initials: "MH", tone: "blue" },
  { name: "Sofia Bennett", company: "Bennett Wellness", value: 3500, stage: "Qualified", source: "Website", initials: "SB", tone: "lilac" },
  { name: "Ethan Cole", company: "Cole Performance", value: 5200, stage: "Discovery Booked", source: "Referral", initials: "EC", tone: "mint" },
  { name: "Ava Mitchell", company: "Mitchell Medspa", value: 4100, stage: "Proposal Sent", source: "Instagram", initials: "AM", tone: "rose" },
];
const seedMembers: TeamMember[] = [
  { id: "u1", name: "Hrushikesh Bhujbal", email: "bhujbalhrushi24@gmail.com", role: "Workspace admin", scope: "All workspace data", status: "Active", initials: "HB", tone: "ink" },
  { id: "u2", name: "Maya Chen", email: "maya@ovyro.com", role: "Account strategist", scope: "4 clients", status: "Active", initials: "MC", tone: "mint" },
  { id: "u3", name: "Aarav Mehta", email: "aarav@ovyro.com", role: "Account strategist", scope: "3 clients", status: "Active", initials: "AM", tone: "lilac" },
  { id: "u4", name: "Jonah Lee", email: "jonah@ovyro.com", role: "Creative team", scope: "3 clients", status: "Active", initials: "JL", tone: "peach" },
];
const seedResources: Resource[] = [];
const defaultWorkflowSteps: WorkflowStep[] = [
  ["Send prerequisite document", "Client access"], ["Set up Meta Business Suite & ad accounts", "Client access"], ["Collect domain and DNS access", "Client intake"], ["Send and collect client survey", "Client intake"], ["Prepare customized foundational copy", "Copy & strategy"], ["Review foundational copy with client", "Client review"], ["Create 14 ad creative scripts", "Creative production"], ["Draft VSL script", "Copy & strategy"], ["Create landing page copy", "Copy & strategy"], ["Connect client domain to the funnel", "Landing Page Development"], ["Build funnel landing page in GoHighLevel", "Landing Page Development"], ["Add approved landing page code", "Landing Page Development"], ["Optimize page layout and mobile experience", "Landing Page Development"], ["Install Meta Pixel", "Landing Page Development"], ["Test campaign events", "Landing Page Development"], ["Set up WhatsApp automation", "Landing Page Development"], ["Submit WhatsApp templates for approval", "Landing Page Development"],
].map(([title, section], i) => ({ id: `workflow-${i}`, title, section, enabled: true }));
const defaultWorkflowSections = ["Client access", "Client intake", "Copy & strategy", "Client review", "Creative production", "Landing Page Development"];

const navGroups = [
  { label: "WORKSPACE", items: [["Overview", "grid"], ["Clients", "users"], ["Onboarding", "check"], ["Lead pipeline", "funnel"], ["Client content", "board"], ["Resources", "folder"]] },
  { label: "MANAGE", items: [["Team & access", "shield"], ["Revenue", "chart"], ["Settings", "settings"]] },
] as const;
const defaultLeadStages = ["New Lead", "Contacted", "Qualified", "Discovery Booked", "Proposal Sent", "Won", "Lost"];
const taskStatuses = ["To do", "In progress", "Waiting on client", "Review", "Done"];
const workspaceTabs = ["Overview", "Clients", "Onboarding", "Lead pipeline", "Client content", "Resources"];
const manageTabs = ["Team & access", "Revenue", "Settings"];
const allAccessTabs = [...workspaceTabs, ...manageTabs];
const memberAccessTabs = workspaceTabs;
const initialRoles: WorkspaceRole[] = [
  { name: "Administrator", access: "All workspace data", users: "1 member", tabs: allAccessTabs },
  { name: "Account strategist", access: "Assigned clients · Edit", users: "3 members", tabs: memberAccessTabs },
  { name: "Creative team", access: "Assigned tasks · Edit", users: "2 members", tabs: ["Overview", "Onboarding", "Client content", "Resources"] },
];
const contentStatuses = ["Planning", "In production", "Internal review", "Client review", "Approved"];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    check: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18m-12 5 2 2 4-4"/></>,
    funnel: <><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/></>,
    board: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m6-18v18"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1A1.7 1.7 0 0 0 4.2 12h-.3a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.3a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.3a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus: <><path d="M12 5v14m-7-7h14"/></>,
    arrow: <><path d="M5 12h14m-7-7 7 7-7 7"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    dots: <><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></>,
    down: <><path d="m7 10 5 5 5-5"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    folder: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><path d="M3 9h18"/></>,
  };
  return <svg {...common} aria-hidden="true">{paths[name] ?? paths.grid}</svg>;
}

const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const defaultWorkspaceProfile = { name: "OVYRO LLP", email: "ovyrollp@gmail.com" };
const emptyWorkspaceSnapshot = { clients: seedClients, tasks: seedTasks, leads: seedLeads, leadStages: defaultLeadStages, onboardingSections: defaultWorkflowSections, onboardingWorkflow: defaultWorkflowSteps, roleRows: initialRoles, resources: seedResources, contentCards: [] as ContentCard[], workspaceProfile: defaultWorkspaceProfile };
const legacyStorageKeys = ["ovyro-ops-v1", "ovyro-onboarding-template", "ovyro-client-templates", "ovyro-client-templates-migrated", "ovyro-workspace-profile"];
function readLegacyWorkspaceSnapshot(): Record<string, unknown> | null {
  try {
    const stored = localStorage.getItem("ovyro-ops-v1");
    const data = stored ? JSON.parse(stored) as Record<string, unknown> : {};
    const snapshot: Record<string, unknown> = {
      clients: Array.isArray(data.clients) ? (data.clients as Client[]).map(client => ({ ...client, currency: "INR" })) : seedClients,
      tasks: Array.isArray(data.tasks) ? data.tasks : seedTasks,
      leads: Array.isArray(data.leads) ? data.leads : seedLeads,
      leadStages: Array.isArray(data.leadStages) && data.leadStages.length ? data.leadStages : defaultLeadStages,
      onboardingSections: Array.isArray(data.onboardingSections) && data.onboardingSections.length ? data.onboardingSections : defaultWorkflowSections,
      onboardingWorkflow: Array.isArray(data.onboardingWorkflow) ? data.onboardingWorkflow : defaultWorkflowSteps,
      roleRows: Array.isArray(data.roleRows) ? data.roleRows.map((role: Partial<WorkspaceRole>) => ({ name: role.name ?? "Custom role", access: role.access ?? "", users: role.users ?? "0 members", tabs: role.tabs ?? memberAccessTabs })) : initialRoles,
      resources: Array.isArray(data.resources) ? data.resources.map((resource: Partial<Resource>) => ({ ...resource, scope: resource.scope ?? "Company", clientId: resource.clientId ?? "", audience: resource.scope === "Client" ? "Client team" : "All workspace members" })) : [...seedResources],
      contentCards: Array.isArray(data.contentCards) ? data.contentCards : [],
      workspaceProfile: defaultWorkspaceProfile,
    };
    const legacyWorkflow = localStorage.getItem("ovyro-onboarding-template");
    if ((!stored || !Array.isArray(data.onboardingWorkflow)) && legacyWorkflow) snapshot.onboardingWorkflow = JSON.parse(legacyWorkflow) as WorkflowStep[];
    const profile = localStorage.getItem("ovyro-workspace-profile");
    if (profile) {
      const parsed = JSON.parse(profile) as { name?: unknown; email?: unknown };
      snapshot.workspaceProfile = { name: typeof parsed.name === "string" ? parsed.name : defaultWorkspaceProfile.name, email: typeof parsed.email === "string" ? parsed.email : defaultWorkspaceProfile.email };
    }
    if (localStorage.getItem("ovyro-client-templates-migrated") !== "true") {
      const templates = JSON.parse(localStorage.getItem("ovyro-client-templates") ?? "[]") as { id?: string; name?: string; kind?: string; url?: string }[];
      const resources = snapshot.resources as Resource[];
      for (const template of templates) if (template.url?.trim() && !resources.some(resource => resource.url === template.url)) resources.push({ id: `resource-${template.id ?? crypto.randomUUID()}`, title: template.name ?? "Shared template", description: `${template.kind ?? "Client"} template shared across client accounts`, scope: "Company", clientId: "", audience: "All workspace members", url: template.url, fileName: "", fileData: "", updated: "Imported" });
    }
    return legacyStorageKeys.some(key => localStorage.getItem(key) !== null) ? snapshot : null;
  } catch { return null; }
}
function hasCustomizedLegacyWorkspace(snapshot: Record<string, unknown>) {
  return Object.keys(emptyWorkspaceSnapshot).some(key => JSON.stringify(snapshot[key]) !== JSON.stringify(emptyWorkspaceSnapshot[key as keyof typeof emptyWorkspaceSnapshot]));
}
function clearLegacyWorkspaceStorage() {
  try { legacyStorageKeys.forEach(key => localStorage.removeItem(key)); } catch { /* migration has already been safely persisted */ }
}
function stableWorkspaceString(value: unknown): string {
  const sortKeys = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(sortKeys);
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sortKeys(child)]));
    return item;
  };
  return JSON.stringify(sortKeys(value));
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [leadStages, setLeadStages] = useState<string[]>(defaultLeadStages);
  const [onboardingSections, setOnboardingSections] = useState<string[]>(defaultWorkflowSections);
  const [onboardingWorkflow, setOnboardingWorkflow] = useState<WorkflowStep[]>(defaultWorkflowSteps);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [resources, setResources] = useState<Resource[]>(seedResources);
  const [contentCards, setContentCards] = useState<ContentCard[]>([]);
  const [selectedContentClient, setSelectedContentClient] = useState("");
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentEditId, setContentEditId] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState("");
  const [contentPlatform, setContentPlatform] = useState("Meta Ads");
  const [contentFormat, setContentFormat] = useState("");
  const [contentStatus, setContentStatus] = useState("Planning");
  const [contentCopy, setContentCopy] = useState("");
  const [contentAssetUrl, setContentAssetUrl] = useState("");
  const [resourceEditId, setResourceEditId] = useState<string | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceScope, setResourceScope] = useState<"Company" | "Client">("Company");
  const [resourceClientId, setResourceClientId] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceFile, setResourceFile] = useState("");
  const [resourceFileName, setResourceFileName] = useState("");
  const [resourceModal, setResourceModal] = useState(false);
  const [leadEditName, setLeadEditName] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [clientEditId, setClientEditId] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEditId, setMemberEditId] = useState<string | null>(null);
  const [roleEditIndex, setRoleEditIndex] = useState<number | null>(null);
  const [roleNameDraft, setRoleNameDraft] = useState("");
  const [roleTabsDraft, setRoleTabsDraft] = useState<string[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [accountsConnected, setAccountsConnected] = useState(false);
  const [workspaceIdentity, setWorkspaceIdentity] = useState<WorkspaceIdentity | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceSyncEnabled, setWorkspaceSyncEnabled] = useState(false);
  const [saveRetry, setSaveRetry] = useState(0);
  const lastSyncedWorkspace = useRef("");
  const [memberRole, setMemberRole] = useState("Account strategist");
  const [memberScope, setMemberScope] = useState("All clients");
  const [memberClientIds, setMemberClientIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [newName, setNewName] = useState("");
  const [newOffer, setNewOffer] = useState("");
  const [newRetainer, setNewRetainer] = useState("");
  const [newStatus, setNewStatus] = useState("Onboarding");
  const [newOwner, setNewOwner] = useState("Unassigned");
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [roleRows, setRoleRows] = useState<WorkspaceRole[]>(initialRoles);
  const [newRole, setNewRole] = useState("");
  const [workspaceProfile, setWorkspaceProfile] = useState(defaultWorkspaceProfile);
  const [workspaceLoadError, setWorkspaceLoadError] = useState("");
  const lastSyncedSnapshot = useRef<Record<string, unknown> | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const latestWorkspaceFingerprint = useRef("");
  const legacyWorkspaceSnapshot = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    legacyWorkspaceSnapshot.current = readLegacyWorkspaceSnapshot();
    setLoaded(true);
  }, []);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { let cancelled = false; fetch("/api/team/members").then(async response => { if (!response.ok) return; const data = await response.json(); if (cancelled || !Array.isArray(data.members)) return; const owner = { ...seedMembers[0], id: "owner", clientIds: clients.map(client=>client.id), tabs: allAccessTabs }; const accounts: TeamMember[] = data.members.map((account: {id:string;name:string;email:string;role:string;clientIds:string[];tabs:string[]})=>({id:account.id,name:account.name,email:account.email,role:account.role,clientIds:account.clientIds,scope:account.clientIds.length===clients.length?"All clients":`${account.clientIds.length} clients`,tabs:account.tabs,status:"Active",initials:account.name.split(/\s+/).slice(0,2).map((part:string)=>part[0]).join("").toUpperCase(),tone:"mint"})); setMembers([owner,...accounts]); setAccountsConnected(true); }).catch(()=>{}); return ()=>{cancelled=true;}; }, [clients]);
  useEffect(() => { let cancelled=false; fetch("/api/auth/session").then(async response=>{if(!response.ok)throw new Error("Session expired"); const data=await response.json(); if(!cancelled)setWorkspaceIdentity(data as WorkspaceIdentity);}).catch(()=>{if(!cancelled)window.location.assign("/login");}).finally(()=>{if(!cancelled)setIdentityReady(true);}); return ()=>{cancelled=true;}; }, []);
  const applyWorkspaceSnapshot = (data: Record<string, unknown>) => {
    if (Array.isArray(data.clients)) setClients((data.clients as Client[]).map(client => ({ ...client, currency: "INR" })));
    if (Array.isArray(data.tasks)) setTasks(data.tasks as Task[]);
    if (Array.isArray(data.leads)) setLeads(data.leads as Lead[]);
    if (Array.isArray(data.leadStages)) setLeadStages(data.leadStages as string[]);
    if (Array.isArray(data.onboardingSections)) setOnboardingSections(data.onboardingSections as string[]);
    if (Array.isArray(data.onboardingWorkflow)) setOnboardingWorkflow(data.onboardingWorkflow as WorkflowStep[]);
    if (Array.isArray(data.roleRows)) setRoleRows(data.roleRows as WorkspaceRole[]);
    if (Array.isArray(data.resources)) setResources(data.resources as Resource[]);
    if (Array.isArray(data.contentCards)) setContentCards(data.contentCards as ContentCard[]);
    if (data.workspaceProfile && typeof data.workspaceProfile === "object") {
      const profile = data.workspaceProfile as { name?: unknown; email?: unknown };
      setWorkspaceProfile({ name: typeof profile.name === "string" ? profile.name : defaultWorkspaceProfile.name, email: typeof profile.email === "string" ? profile.email : defaultWorkspaceProfile.email });
    }
  };
  const workspaceSnapshot: Record<string, unknown> = workspaceIdentity?.kind === "owner"
    ? { clients, tasks, leads, leadStages, onboardingSections, onboardingWorkflow, roleRows, resources, contentCards, workspaceProfile }
    : { clients, tasks, leads, leadStages, onboardingSections, onboardingWorkflow, roleRows: workspaceIdentity?.tabs?.includes("Team & access") ? roleRows : undefined, resources, contentCards, workspaceProfile };
  const workspaceFingerprint = stableWorkspaceString(workspaceSnapshot);
  latestWorkspaceFingerprint.current = workspaceFingerprint;

  useEffect(() => {
    if (!loaded || !identityReady || !workspaceIdentity) return;
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (!response.ok) throw new Error("The shared workspace database could not be reached.");
        const payload = await response.json() as { state: Record<string, unknown> | null };
        if (cancelled) return;
        let serverState = payload.state;
        if (!serverState) {
          if (workspaceIdentity.kind !== "owner") throw new Error("The workspace has not been initialized by an owner yet.");
          const migrationSnapshot = legacyWorkspaceSnapshot.current;
          const initialize = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: migrationSnapshot ?? emptyWorkspaceSnapshot, initializeOnly: true }) });
          if (!initialize.ok) throw new Error("The shared workspace could not be initialized.");
          const initialized = await initialize.json() as { state: Record<string, unknown> | null };
          if (!initialized.state) throw new Error("The shared workspace did not return its saved data.");
          serverState = initialized.state;
          if (migrationSnapshot && hasCustomizedLegacyWorkspace(migrationSnapshot) && stableWorkspaceString(migrationSnapshot) !== stableWorkspaceString(serverState)) {
            const merged = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: migrationSnapshot, baseState: emptyWorkspaceSnapshot }) });
            if (!merged.ok) throw new Error("Could not safely merge this browser’s saved workspace data.");
            const result = await merged.json() as { state: Record<string, unknown> };
            serverState = result.state;
          }
        } else if (workspaceIdentity.kind === "owner" && legacyWorkspaceSnapshot.current && hasCustomizedLegacyWorkspace(legacyWorkspaceSnapshot.current)) {
          const merged = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: legacyWorkspaceSnapshot.current, baseState: emptyWorkspaceSnapshot }) });
          if (!merged.ok) throw new Error("Could not safely merge this browser’s saved workspace data.");
          const result = await merged.json() as { state: Record<string, unknown> };
          serverState = result.state;
        }
        if (cancelled) return;
        applyWorkspaceSnapshot(serverState);
        if (workspaceIdentity.kind === "owner" && legacyWorkspaceSnapshot.current) clearLegacyWorkspaceStorage();
        lastSyncedSnapshot.current = serverState;
        lastSyncedWorkspace.current = stableWorkspaceString(serverState);
        setWorkspaceLoadError("");
        setWorkspaceSyncEnabled(true);
        setWorkspaceReady(true);
      } catch (error) {
        if (!cancelled) {
          setWorkspaceLoadError(error instanceof Error ? error.message : "Shared workspace unavailable. Try again.");
          setWorkspaceSyncEnabled(false);
          setWorkspaceReady(true);
        }
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [loaded, identityReady, workspaceIdentity]);

  useEffect(() => {
    if (!workspaceReady || !workspaceSyncEnabled || !workspaceIdentity || workspaceFingerprint === lastSyncedWorkspace.current) return;
    const snapshot = workspaceSnapshot;
    const fingerprint = workspaceFingerprint;
    const retryDelay = saveRetry === 0 ? 400 : Math.min(1000 * 2 ** Math.min(saveRetry, 5), 30000);
    const timer = window.setTimeout(() => {
      saveQueue.current = saveQueue.current.then(async () => {
        const baseState = lastSyncedSnapshot.current;
        if (!baseState) throw new Error("No server snapshot is available for this save.");
        const response = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: snapshot, baseState }) });
        if (!response.ok) throw new Error("Workspace changes could not be saved to the server.");
        const result = await response.json() as { state: Record<string, unknown> | null };
        if (!result.state) throw new Error("The server did not confirm the workspace save.");
        lastSyncedSnapshot.current = result.state;
        lastSyncedWorkspace.current = stableWorkspaceString(result.state);
        setSaveRetry(0);
        setWorkspaceLoadError("");
        if (latestWorkspaceFingerprint.current === fingerprint) applyWorkspaceSnapshot(result.state);
      }).catch(error => {
        setWorkspaceLoadError(error instanceof Error ? error.message : "Workspace changes could not be saved to the server.");
        setSaveRetry(attempt => attempt + 1);
      });
    }, retryDelay);
    return () => window.clearTimeout(timer);
  }, [workspaceReady, workspaceSyncEnabled, workspaceIdentity, workspaceFingerprint, saveRetry]);

  useEffect(() => {
    if (!workspaceReady || !workspaceSyncEnabled || !workspaceIdentity) return;
    const syncIfClean = async () => {
      if (workspaceFingerprint !== lastSyncedWorkspace.current) return;
      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { state: Record<string, unknown> | null };
        if (!result.state || stableWorkspaceString(result.state) === lastSyncedWorkspace.current) return;
        applyWorkspaceSnapshot(result.state);
        lastSyncedSnapshot.current = result.state;
        lastSyncedWorkspace.current = stableWorkspaceString(result.state);
      } catch { /* the next focus or polling cycle retries */ }
    };
    const onFocus = () => { void syncIfClean(); };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => { void syncIfClean(); }, 5000);
    return () => { window.removeEventListener("focus", onFocus); window.clearInterval(timer); };
  }, [workspaceReady, workspaceSyncEnabled, workspaceIdentity, workspaceFingerprint]);

  useEffect(() => { if (clients.length && !clients.some(client => client.id === selectedContentClient)) setSelectedContentClient(clients[0].id); }, [clients, selectedContentClient]);

  const isOwner = workspaceIdentity?.kind === "owner";
  const accessibleTabNames = isOwner ? allAccessTabs : workspaceIdentity?.tabs ?? [];
  const canManageTeam = isOwner || accessibleTabNames.includes("Team & access");
  const roleTabOptions = isOwner ? allAccessTabs : accessibleTabNames;
  const availableRoles = roleRows.filter(role => isOwner || role.tabs.every(tab => accessibleTabNames.includes(tab)));
  const allowedClients = isOwner ? clients : clients.filter(client=>workspaceIdentity?.clientIds?.includes(client.id));
  const allowedClientNames = new Set(allowedClients.map(client=>client.name));
  const visibleTasks = isOwner ? tasks : tasks.filter(task=>allowedClientNames.has(task.client));
  const visibleLeads = isOwner || accessibleTabNames.includes("Lead pipeline") ? leads : [];
  const visibleContentCards = contentCards.filter(card=>allowedClients.some(client=>client.id===card.clientId));
  const visibleResources = resources.filter(resource=>resource.scope==="Company" || allowedClients.some(client=>client.id===resource.clientId));
  const activeClients = allowedClients.filter(c => c.status === "Active" || c.status === "Onboarding").length;
  const mrr = allowedClients.filter(c => c.status === "Active" || c.status === "Onboarding").reduce((n, c) => n + c.retainer, 0);
  const filteredClients = allowedClients.filter(c => `${c.name} ${c.offer} ${c.owner}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { if (identityReady && workspaceIdentity && !accessibleTabNames.includes(active)) setActive(accessibleTabNames[0] ?? "Overview"); }, [identityReady, workspaceIdentity, active, accessibleTabNames]);
  const ping = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const signOut = async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.assign("/login"); } };
  const openNewClient = () => { setClientEditId(null); setNewName(""); setNewOffer(""); setNewRetainer(""); setNewStatus("Onboarding"); setNewOwner("Unassigned"); setShowNewClient(true); };
  const openEditClient = (client: Client) => { setClientEditId(client.id); setNewName(client.name); setNewOffer(client.offer); setNewRetainer(String(client.retainer)); setNewStatus(client.status); setNewOwner(client.owner || "Unassigned"); setShowNewClient(true); };
  const addClient = () => {
    if (!newName.trim()) return;
    const clientName = newName.trim();
    if (clientEditId) {
      const oldClient = clients.find(client => client.id === clientEditId);
      const initials = clientName.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
      setClients(clients.map(client => client.id === clientEditId ? { ...client, name: clientName, offer: newOffer.trim(), retainer: Number(newRetainer) || 0, status: newStatus, owner: newOwner, initials, currency: "INR" } : client));
      if (oldClient && oldClient.name !== clientName) setTasks(tasks.map(task => task.client === oldClient.name ? { ...task, client: clientName } : task));
      setShowNewClient(false); setClientEditId(null); ping(`${clientName} updated`); return;
    }
    const created: Client = { id: `OV-${crypto.randomUUID()}`, name: clientName, offer: newOffer.trim() || "New client engagement", status: newStatus, retainer: Number(newRetainer) || 0, currency: "INR", initials: clientName.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase(), tone: "mint", owner: newOwner, started: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) };
    setClients([created, ...clients]);
    const activeSteps = onboardingWorkflow.filter(step => step.enabled);
    const kickoff: Task[] = activeSteps.map((step, i) => ({ id: `${created.id}-task-${step.id}`, title: step.title, client: clientName, owner: i < 4 ? "Account team" : "Unassigned", due: i < 3 ? "Today" : `Day ${i + 1}`, status: i === 0 ? "In progress" : "To do", section: step.section }));
    setTasks([...kickoff, ...tasks]);
    setShowNewClient(false); setNewName(""); setNewOffer(""); setNewRetainer(""); setNewStatus("Onboarding"); setNewOwner("Unassigned"); setActive("Clients"); ping(`${clientName} added with an onboarding checklist`);
  };
  const deleteClient = (id: string) => {
    const client = clients.find(item => item.id === id);
    setClients(clients.filter(item => item.id !== id));
    if (client) { setTasks(tasks.filter(task => task.client !== client.name)); setContentCards(contentCards.filter(card => card.clientId !== client.id)); setResources(resources.filter(resource => resource.scope !== "Client" || resource.clientId !== client.id)); }
    setDeleteTarget(null); ping(`${client?.name ?? "Client"} and its onboarding tasks removed`);
  };
  const openNewMember = () => { setMemberEditId(null); setMemberName(""); setMemberEmail(""); setMemberPassword(""); setMemberRole(availableRoles.some(role => role.name === "Account strategist") ? "Account strategist" : availableRoles[0]?.name ?? "Unassigned"); setMemberScope("All clients"); setMemberClientIds(clients.map(client => client.id)); setShowMemberModal(true); };
  const openEditMember = (member: TeamMember) => { if (member.id === "owner") { ping("Update the owner account through its administrator configuration."); return; } setMemberEditId(member.id); setMemberName(member.name); setMemberEmail(member.email); setMemberPassword(""); setMemberRole(member.role); setMemberScope(member.scope); setMemberClientIds(member.clientIds ?? clients.map(client => client.id)); setShowMemberModal(true); };
  const setMemberClients = (ids: string[]) => { setMemberClientIds(ids); setMemberScope(ids.length === clients.length ? "All clients" : ids.length === 0 ? "No clients" : `${ids.length} client${ids.length === 1 ? "" : "s"}`); };
  const saveMember = async () => {
    if (!memberName.trim() || !memberEmail.trim()) return;
    if (!accountsConnected) { ping("Team account database is not connected."); return; }
    if (!memberEditId && memberPassword.length < 12) { ping("Set a password with at least 12 characters."); return; }
    const initials = memberName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const payload = { name: memberName.trim(), email: memberEmail.trim(), password: memberPassword || undefined, role: memberRole, clientIds: memberClientIds, tabs: roleRows.find(role=>role.name===memberRole)?.tabs ?? memberAccessTabs };
    try { const response = await fetch(memberEditId ? `/api/team/members/${memberEditId}` : "/api/team/members", { method: memberEditId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) { ping(data.error ?? "Could not save team account."); return; } const account = data.member as {id:string;name:string;email:string;role:string;clientIds:string[];tabs:string[]}; const updated: TeamMember = { id:account.id,name:account.name,email:account.email,role:account.role,clientIds:account.clientIds,tabs:account.tabs,scope:account.clientIds.length===clients.length?"All clients":`${account.clientIds.length} clients`,status:"Active",initials:account.name.split(/\s+/).slice(0,2).map((part:string)=>part[0]).join("").toUpperCase(),tone:"mint" }; setMembers([members.find(member=>member.id==="owner") ?? {...seedMembers[0],id:"owner"}, ...members.filter(member=>member.id!==updated.id&&member.id!=="owner"),updated]); ping(memberEditId ? `${memberName.trim()} account updated` : `${memberName.trim()} can sign in now`); } catch { ping("Could not reach the team account service."); return; }
    setShowMemberModal(false);
  };
  const deleteMember = async (id: string) => { const member = members.find(item => item.id === id); if (id === "owner") { setDeleteTarget(null); return; } try { const response=await fetch(`/api/team/members/${id}`,{method:"DELETE"}); const data=await response.json(); if(!response.ok){ping(data.error??"Could not remove account.");return;} setMembers(members.filter(item => item.id !== id)); setDeleteTarget(null); ping(`${member?.name ?? "Member"} account removed`); } catch { ping("Could not reach the team account service."); } };
  const updateAssignedAccounts = async (assigned: TeamMember[], role: string, tabs: string[]) => {
    const updated: TeamMember[] = [];
    for (const member of assigned) {
      try {
        const response = await fetch(`/api/team/members/${member.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: member.name, email: member.email, role, clientIds: member.clientIds ?? [], tabs }) });
        if (!response.ok) throw new Error("The server rejected a member permission update.");
        updated.push(member);
      } catch {
        for (const prior of updated.reverse()) {
          try { await fetch(`/api/team/members/${prior.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: prior.name, email: prior.email, role: prior.role, clientIds: prior.clientIds ?? [], tabs: prior.tabs ?? [] }) }); } catch { /* report the original failure */ }
        }
        ping("Could not update every assigned account. The role change was cancelled; check the team database and try again.");
        return false;
      }
    }
    return true;
  };
  const deleteRole = async (name: string) => { const assigned = members.filter(member=>member.role===name&&member.id!=="owner"); if (!await updateAssignedAccounts(assigned, "Unassigned", [])) return; setRoleRows(roleRows.filter(role => role.name !== name)); setMembers(members.map(member => member.role === name ? { ...member, role: "Unassigned", tabs: [] } : member)); setDeleteTarget(null); ping(`${name} role deleted`); };
  const openEditRole = (index: number) => { const role = roleRows[index]; setRoleEditIndex(index); setRoleNameDraft(role.name); setRoleTabsDraft(role.tabs); };
  const saveRole = async () => { if (roleEditIndex === null || !roleNameDraft.trim() || roleTabsDraft.length === 0) return; const previous = roleRows[roleEditIndex]; const next = roleNameDraft.trim(); if (roleRows.some((role, index) => index !== roleEditIndex && role.name.toLowerCase() === next.toLowerCase())) { ping("A role with that name already exists"); return; } const assigned = members.filter(member=>member.role===previous.name&&member.id!=="owner"); if (!await updateAssignedAccounts(assigned, next, roleTabsDraft)) return; setRoleRows(roleRows.map((role, index) => index === roleEditIndex ? { ...role, name: next, tabs: roleTabsDraft, access: roleTabsDraft.join(" · ") } : role)); if (previous.name !== next) setMembers(members.map(member => member.role === previous.name ? { ...member, role: next, tabs: roleTabsDraft } : member)); setRoleEditIndex(null); ping(`${next} role updated`); };
  const moveTask = (id: string, status: string) => setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  const moveLead = (name: string, stage: string) => setLeads(leads.map(l => l.name === name ? { ...l, stage } : l));
  const renameLeadStage = (stage: string, value: string) => {
    const next = value.trim();
    if (!next || leadStages.some(item => item !== stage && item.toLowerCase() === next.toLowerCase())) { ping("Enter a unique stage name."); return; }
    setLeadStages(leadStages.map(item => item === stage ? next : item));
    setLeads(leads.map(lead => lead.stage === stage ? { ...lead, stage: next } : lead));
  };
  const addLeadStage = (value: string) => {
    const next = value.trim();
    if (!next || leadStages.some(item => item.toLowerCase() === next.toLowerCase())) { ping("Enter a unique stage name."); return false; }
    setLeadStages([...leadStages, next]); return true;
  };
  const deleteLeadStage = (stage: string) => {
    if (leads.some(lead => lead.stage === stage)) { ping("Move or remove the leads in this stage before deleting it."); return; }
    if (leadStages.length <= 1) { ping("Keep at least one pipeline stage."); return; }
    setLeadStages(leadStages.filter(item => item !== stage));
  };
  const saveLead = () => {
    if (!newLeadName.trim() || !newLeadCompany.trim()) return;
    const name = newLeadName.trim();
    if (leadEditName) {
      setLeads(leads.map(l => l.name === leadEditName ? { ...l, name, company: newLeadCompany.trim(), value: Number(newLeadValue) || 0, initials: name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() } : l));
      setLeadEditName(null); ping(`${name} updated`);
    } else {
      setLeads([{ name, company: newLeadCompany.trim(), value: Number(newLeadValue) || 0, stage: leadStages[0] ?? "New Lead", source: "Manual entry", initials: name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase(), tone: "mint" }, ...leads]);
      ping(`${name} added to the pipeline`);
    }
    setShowNewLead(false); setNewLeadName(""); setNewLeadCompany(""); setNewLeadValue(""); setActive("Lead pipeline");
  };
  const editLead = (lead: Lead) => { setLeadEditName(lead.name); setNewLeadName(lead.name); setNewLeadCompany(lead.company); setNewLeadValue(String(lead.value)); setShowNewLead(true); };
  const openContent = (card?: ContentCard) => { setContentEditId(card?.id ?? null); setContentTitle(card?.title ?? ""); setContentPlatform(card?.platform ?? "Meta Ads"); setContentFormat(card?.format ?? ""); setContentStatus(card?.status ?? "Planning"); setContentCopy(card?.copy ?? ""); setContentAssetUrl(card?.assetUrl ?? ""); setShowContentModal(true); };
  const saveContent = () => {
    if (!contentTitle.trim() || !selectedContentClient) return;
    const item: ContentCard = { id: contentEditId ?? `content-${Date.now()}`, clientId: selectedContentClient, title: contentTitle.trim(), platform: contentPlatform, format: contentFormat.trim(), status: contentStatus, copy: contentCopy.trim(), assetUrl: contentAssetUrl.trim(), updated: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) };
    setContentCards(contentEditId ? contentCards.map(card => card.id === contentEditId ? item : card) : [item, ...contentCards]);
    setShowContentModal(false); setContentEditId(null); setContentTitle(""); setContentFormat(""); setContentCopy(""); setContentAssetUrl(""); ping(contentEditId ? "Content updated" : "Content added to this client");
  };
  const saveResource = () => {
    if (!resourceTitle.trim() || (!resourceUrl.trim() && !resourceFile) || (resourceScope === "Client" && !resourceClientId)) return;
    const item: Resource = { id: resourceEditId ?? `resource-${Date.now()}`, title: resourceTitle.trim(), description: resourceDescription.trim(), scope: resourceScope, clientId: resourceScope === "Client" ? resourceClientId : "", audience: resourceScope === "Client" ? "Client team" : "All workspace members", url: resourceUrl.trim(), fileName: resourceFileName, fileData: resourceFile, updated: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) };
    setResources(resourceEditId ? resources.map(r => r.id === resourceEditId ? item : r) : [item, ...resources]);
    setResourceModal(false); setResourceEditId(null); setResourceTitle(""); setResourceDescription(""); setResourceScope("Company"); setResourceClientId(""); setResourceUrl(""); setResourceFile(""); setResourceFileName(""); ping(resourceEditId ? "Resource updated" : "Resource added");
  };
  const openResource = (r?: Resource) => { setResourceEditId(r?.id ?? null); setResourceTitle(r?.title ?? ""); setResourceDescription(r?.description ?? ""); setResourceScope(r?.scope ?? "Company"); setResourceClientId(r?.clientId ?? clients[0]?.id ?? ""); setResourceUrl(r?.url ?? ""); setResourceFile(r?.fileData ?? ""); setResourceFileName(r?.fileName ?? ""); setResourceModal(true); };
  const deleteLead = (id: string) => { const lead = leads.find(l => l.name === id); setLeads(leads.filter(l => l.name !== id)); setDeleteTarget(null); ping(`${lead?.name ?? "Lead"} removed from the pipeline`); };

  // Keep the server render and the browser's first render identical. The app shell
  // depends on the authenticated session, which is only known after hydration.
  if (!mounted || !identityReady || !workspaceIdentity || !workspaceReady) return <main className="login-shell"><section className="login-card">Loading your workspace…</section></main>;
  if (!workspaceSyncEnabled) return <main className="login-shell"><section className="login-card"><h1>Shared workspace unavailable</h1><p className="login-description">{workspaceLoadError || "Workspace data is available only from the server. No browser copy will be used."}</p><button className="button button-dark login-submit" onClick={() => window.location.reload()}>Retry connection</button></section></main>;
  if (!isOwner && accessibleTabNames.length === 0) return <main className="login-shell"><section className="login-card"><h1>No workspace tabs assigned</h1><p className="login-description">Ask your workspace owner to assign a role with workspace tabs.</p><button className="button button-dark login-submit" onClick={signOut}>Sign out</button></section></main>;
  if (!accessibleTabNames.includes(active)) return <main className="login-shell"><section className="login-card">Loading your workspace…</section></main>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">O<span>.</span></div><div><div className="brand-name">ovyro</div><div className="brand-caption">GROWTH OPERATIONS</div></div><button className="workspace-switch" aria-label="Switch workspace"><Icon name="down" size={15}/></button></div>
      <div className="workspace-card"><div className="workspace-icon">O</div><div className="workspace-info"><strong>OVYRO LLP</strong><span>Internal workspace</span></div><span className="online-dot"/></div>
      <nav className="side-nav">{navGroups.map(group => { const items=group.items.filter(([label])=>accessibleTabNames.includes(label)); return items.length ? <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{items.map(([label, icon]) => <button className={`nav-item ${active === label ? "selected" : ""}`} key={label} onClick={() => setActive(label)}><Icon name={icon}/><span>{label}</span>{label === "Onboarding" && <span className="nav-count">{visibleTasks.filter(t => t.status !== "Done").length}</span>}{label === "Lead pipeline" && <span className="nav-count muted-count">{visibleLeads.length}</span>}</button>)}</div> : null;})}</nav>
      <div className="sidebar-bottom"><div className="profile"><div className="avatar avatar-ink">{(workspaceIdentity.name ?? "Hrushikesh Bhujbal").split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase()}</div><div className="profile-meta"><strong>{workspaceIdentity.name ?? "Hrushikesh Bhujbal"}</strong><span>{workspaceIdentity.kind === "owner" ? "Workspace owner" : workspaceIdentity.role}</span></div><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={signOut}><Icon name="logout"/></button></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>OVYRO</span><span className="crumb-slash">/</span><strong>{active}</strong></div><div className="top-actions"><label className="search-box"><Icon name="search" size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="icon-button notification" aria-label="Notifications" onClick={() => ping("You’re all caught up")}><Icon name="bell"/><i/></button><div className="avatar avatar-ink top-avatar">{(workspaceIdentity.name ?? "Hrushikesh Bhujbal").split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase()}</div></div></header>
      {workspaceLoadError && <div className="workspace-sync-warning" role="alert"><span>{workspaceLoadError} Your latest changes may not be saved.</span><button type="button" onClick={() => window.location.reload()}>Reload from server</button></div>}
      <div className="page-wrap">
        {active === "Overview" && <Overview clients={allowedClients} tasks={visibleTasks} leads={visibleLeads} leadStages={leadStages} activeClients={activeClients} mrr={mrr} onNavigate={setActive} onNew={openNewClient} onTaskMove={moveTask}/>}
        {active === "Clients" && <ClientsPage clients={filteredClients} onNew={openNewClient} onEdit={openEditClient} onDelete={(client) => setDeleteTarget({ kind: "client", id: client.id, name: client.name })} query={query}/>}
        {active === "Onboarding" && <OnboardingPage tasks={visibleTasks} sections={onboardingSections} onMove={moveTask} clients={allowedClients}/>}
        {active === "Lead pipeline" && <LeadsPage leads={visibleLeads} stages={leadStages} onAddStage={addLeadStage} onRenameStage={renameLeadStage} onDeleteStage={deleteLeadStage} onMove={moveLead} onNew={() => { setLeadEditName(null); setNewLeadName(""); setNewLeadCompany(""); setNewLeadValue(""); setShowNewLead(true); }} onEdit={editLead} onDelete={lead => setDeleteTarget({ kind: "lead", id: lead.name, name: lead.name })}/>}
        {active === "Client content" && <ClientContentPage clients={allowedClients} cards={visibleContentCards} selectedClientId={allowedClients.some(client=>client.id===selectedContentClient)?selectedContentClient:allowedClients[0]?.id??""} onSelectClient={setSelectedContentClient} onAdd={() => openContent()} onEdit={openContent}/> }
        {active === "Resources" && <ResourcesPage resources={visibleResources} clients={allowedClients} onNew={() => openResource()} onEdit={openResource}/> }
        {active === "Team & access" && canManageTeam && <TeamPage roles={roleRows} setRoles={setRoleRows} roleTabOptions={roleTabOptions} newRole={newRole} setNewRole={setNewRole} members={members} accountsConnected={accountsConnected} onInvite={openNewMember} onEditMember={openEditMember} onDeleteMember={(member) => setDeleteTarget({ kind: "member", id: member.id, name: member.name })} onEditRole={openEditRole} onDeleteRole={(role) => setDeleteTarget({ kind: "role", id: role.name, name: role.name })}/>}
        {active === "Revenue" && <RevenuePage clients={allowedClients}/>}
        {active === "Settings" && <SettingsPage onNavigate={setActive} workflow={onboardingWorkflow} setWorkflow={setOnboardingWorkflow} sections={onboardingSections} setSections={setOnboardingSections} workspaceProfile={workspaceProfile} setWorkspaceProfile={setWorkspaceProfile} />}
      </div>
    </main>

    {showNewClient && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setShowNewClient(false); setClientEditId(null); } }}><form className="modal" onSubmit={e => { e.preventDefault(); addClient(); }}><div className="modal-head"><div><div className="eyebrow">CLIENT WORKSPACE</div><h2>{clientEditId ? "Edit client" : "Add a client"}</h2><p>{clientEditId ? "Update this client’s details and account settings." : "Create a client space and generate their onboarding checklist."}</p></div><button type="button" className="icon-button" onClick={() => { setShowNewClient(false); setClientEditId(null); }}><Icon name="close"/></button></div><label className="field-label">Client or business name<input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Acme Wellness" required/></label><label className="field-label">Offer / engagement<input value={newOffer} onChange={e => setNewOffer(e.target.value)} placeholder="e.g. Patient acquisition"/></label><label className="field-label">Monthly retainer (INR)<input type="number" min="0" value={newRetainer} onChange={e => setNewRetainer(e.target.value)} placeholder="0"/></label><label className="field-label">Client status<select value={newStatus} onChange={e => setNewStatus(e.target.value)}><option>Onboarding</option><option>Active</option><option>Paused</option></select></label><label className="field-label">Account owner<select value={newOwner} onChange={e => setNewOwner(e.target.value)}><option value="Unassigned">Unassigned</option>{[...new Set([newOwner, ...members.map(member => member.name)].filter(name => name !== "Unassigned"))].map(name=><option key={name} value={name}>{name}</option>)}</select></label><div className="modal-foot"><span>{clientEditId ? "Changes sync to the shared workspace" : `${onboardingWorkflow.filter(step => step.enabled).length} starter tasks will be added`}</span><button type="button" className="button button-quiet" onClick={() => { setShowNewClient(false); setClientEditId(null); }}>Cancel</button><button type="submit" className="button button-dark"><Icon name={clientEditId ? "edit" : "plus"} size={16}/>{clientEditId ? "Save changes" : "Create client"}</button></div></form></div>}
    {showNewLead && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowNewLead(false); }}><form className="modal" onSubmit={e => { e.preventDefault(); saveLead(); }}><div className="modal-head"><div><div className="eyebrow">NEW BUSINESS</div><h2>{leadEditName ? "Edit lead" : "Add a lead"}</h2><p>{leadEditName ? "Update this opportunity’s contact, company, and retainer." : "Start tracking an opportunity in your pipeline."}</p></div><button type="button" className="icon-button" onClick={() => setShowNewLead(false)}><Icon name="close"/></button></div><label className="field-label">Contact name<input autoFocus value={newLeadName} onChange={e => setNewLeadName(e.target.value)} placeholder="e.g. Alex Morgan" required/></label><label className="field-label">Company<input value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)} placeholder="e.g. Morgan Wellness" required/></label><label className="field-label">Potential monthly retainer (INR)<input type="number" min="0" value={newLeadValue} onChange={e => setNewLeadValue(e.target.value)} placeholder="0"/></label><div className="modal-foot"><span>{leadEditName ? "Stage and source stay unchanged" : "Lead will start in New Lead"}</span><button type="button" className="button button-quiet" onClick={() => setShowNewLead(false)}>Cancel</button><button type="submit" className="button button-dark"><Icon name={leadEditName ? "edit" : "plus"} size={16}/> {leadEditName ? "Save changes" : "Add lead"}</button></div></form></div>}
    {showContentModal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowContentModal(false); }}><form className="modal content-editor-modal" onSubmit={e=>{e.preventDefault();saveContent();}}><div className="modal-head"><div><div className="eyebrow">{clients.find(c=>c.id===selectedContentClient)?.name ?? "CLIENT"} · CONTENT</div><h2>{contentEditId ? "Edit content" : "Add content"}</h2><p>This card belongs to the selected client and stays separate from onboarding tasks.</p></div><button type="button" className="icon-button" onClick={()=>setShowContentModal(false)}><Icon name="close"/></button></div><label className="field-label">Content title<input autoFocus value={contentTitle} onChange={e=>setContentTitle(e.target.value)} placeholder="e.g. Founder story — Meta video ad" required/></label><div className="content-form-row"><label className="field-label">Channel<select value={contentPlatform} onChange={e=>setContentPlatform(e.target.value)}><option>Meta Ads</option><option>Google / YouTube</option><option>Landing page VSL</option><option>Other</option></select></label><label className="field-label">Creative type / framework<input value={contentFormat} onChange={e=>setContentFormat(e.target.value)} placeholder="e.g. UGC testimonial"/></label></div><label className="field-label">Status<select value={contentStatus} onChange={e=>setContentStatus(e.target.value)}>{contentStatuses.map(status=><option key={status}>{status}</option>)}</select></label><label className="field-label">Script / concept<textarea rows={5} value={contentCopy} onChange={e=>setContentCopy(e.target.value)} placeholder="Write the concept, hook, script, or production notes..."/></label><label className="field-label">Creative asset link<input type="url" value={contentAssetUrl} onChange={e=>setContentAssetUrl(e.target.value)} placeholder="https://drive.google.com/..."/></label><div className="modal-foot"><span>Saved to the shared workspace</span><button type="button" className="button button-quiet" onClick={()=>setShowContentModal(false)}>Cancel</button><button type="submit" className="button button-dark"><Icon name={contentEditId ? "edit" : "plus"} size={15}/>{contentEditId ? "Save changes" : "Add card"}</button></div></form></div>}
    {resourceModal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setResourceModal(false); }}><form className="modal" onSubmit={e => { e.preventDefault(); saveResource(); }}><div className="modal-head"><div><div className="eyebrow">SHARED WORKSPACE LIBRARY</div><h2>{resourceEditId ? "Edit resource" : "Add a resource"}</h2><p>Choose whether this belongs to the whole company or a specific client.</p></div><button type="button" className="icon-button" onClick={() => setResourceModal(false)}><Icon name="close"/></button></div><label className="field-label">Resource location<select value={resourceScope} onChange={e => setResourceScope(e.target.value as "Company" | "Client")}><option value="Company">Company-wide resource</option><option value="Client">Client-specific resource</option></select></label>{resourceScope === "Client" && <label className="field-label">Client<select value={resourceClientId} onChange={e => setResourceClientId(e.target.value)} required>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}<label className="field-label">Resource name<input autoFocus value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="e.g. Brand guidelines" required/></label><label className="field-label">Description<input value={resourceDescription} onChange={e => setResourceDescription(e.target.value)} placeholder="What is this resource for?"/></label><label className="field-label">File link<input type="url" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="https://drive.google.com/..."/></label><label className="field-label">Or upload a file<input type="file" onChange={e => { const f=e.target.files?.[0]; if (!f) return; if (f.size > 2500000) { ping("Files must be 2.5 MB or smaller"); e.currentTarget.value=""; return; } const reader=new FileReader(); reader.onload=()=>{ setResourceFile(String(reader.result ?? "")); setResourceFileName(f.name); }; reader.readAsDataURL(f); }}/>{resourceFileName && <small className="resource-file-selected">Attached: {resourceFileName}</small>}</label><div className="settings-note resource-scope-note"><strong>{resourceScope === "Client" ? "Client team resource" : "Company-wide resource"}</strong><span>{resourceScope === "Client" ? "Organized under the selected client. Intended for teammates who work on that account." : "Available to the whole OVYRO workspace."} Access follows the workspace client scope and the audience selected here.</span></div><div className="modal-foot"><span>Saved to the shared workspace</span><button type="button" className="button button-quiet" onClick={() => setResourceModal(false)}>Cancel</button><button type="submit" className="button button-dark"><Icon name={resourceEditId ? "edit" : "plus"} size={16}/>{resourceEditId ? "Save changes" : "Add resource"}</button></div></form></div>}
    {showMemberModal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowMemberModal(false); }}><form className="modal" onSubmit={e => { e.preventDefault(); saveMember(); }}><div className="modal-head"><div><div className="eyebrow">TEAM & ACCESS</div><h2>{memberEditId ? "Edit team account" : "Create team account"}</h2><p>{memberEditId ? "Update this member’s login, role, or client access." : "Set an email and password. The account is active as soon as you save."}</p></div><button type="button" className="icon-button" onClick={() => setShowMemberModal(false)}><Icon name="close"/></button></div><label className="field-label">Full name<input autoFocus value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="e.g. Priya Shah" required/></label><label className="field-label">Email address<input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="name@ovyro.com" required/></label><label className="field-label">Password{memberEditId && <span className="field-hint">Leave blank to keep the current password.</span>}<input type="password" autoComplete="new-password" value={memberPassword} onChange={e=>setMemberPassword(e.target.value)} placeholder={memberEditId ? "Set a new password (optional)" : "At least 12 characters"} required={!memberEditId} minLength={12}/></label><label className="field-label">Role<select value={memberRole} onChange={e => setMemberRole(e.target.value)}>{[...new Set([...availableRoles.map(role => role.name), ...(members.some(member => member.role === "Unassigned") ? ["Unassigned"] : [])])].map(role => <option key={role}>{role}</option>)}</select></label><fieldset className="client-scope-picker"><legend>Client access</legend><label><input type="checkbox" checked={memberClientIds.length === clients.length && clients.length > 0} onChange={e => setMemberClients(e.target.checked ? clients.map(client => client.id) : [])}/> All clients <span>({clients.length})</span></label>{clients.map(client => <label key={client.id}><input type="checkbox" checked={memberClientIds.includes(client.id)} onChange={e => setMemberClients(e.target.checked ? [...memberClientIds, client.id] : memberClientIds.filter(id => id !== client.id))}/>{client.name}</label>)}<small>{memberClientIds.length} of {clients.length} clients selected</small></fieldset><div className="modal-foot"><span>{memberEditId ? "Password changes take effect at next sign in" : "Active immediately · credentials stay private"}</span><button type="button" className="button button-quiet" onClick={() => setShowMemberModal(false)}>Cancel</button><button type="submit" className="button button-dark"><Icon name={memberEditId ? "edit" : "plus"} size={16}/>{memberEditId ? "Save account" : "Create account"}</button></div></form></div>}
    {roleEditIndex !== null && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setRoleEditIndex(null); }}><form className="modal" onSubmit={e => { e.preventDefault(); saveRole(); }}><div className="modal-head"><div><div className="eyebrow">ROLE SETTINGS</div><h2>Edit role</h2><p>Select which workspace and management tabs members with this role may access.</p></div><button type="button" className="icon-button" onClick={() => setRoleEditIndex(null)}><Icon name="close"/></button></div><label className="field-label">Role name<input autoFocus value={roleNameDraft} onChange={e => setRoleNameDraft(e.target.value)} required/></label><fieldset className="client-scope-picker"><legend>Workspace and management tabs</legend>{roleTabOptions.map(tab=><label key={tab}><input type="checkbox" checked={roleTabsDraft.includes(tab)} onChange={e=>setRoleTabsDraft(e.target.checked?[...roleTabsDraft,tab]:roleTabsDraft.filter(item=>item!==tab))}/>{tab}</label>)}<small>{roleTabsDraft.length} tabs selected.</small></fieldset><div className="modal-foot"><span>Changes apply to members assigned this role</span><button type="button" className="button button-quiet" onClick={() => setRoleEditIndex(null)}>Cancel</button><button type="submit" className="button button-dark" disabled={!roleTabsDraft.length}><Icon name="edit" size={16}/>Save role</button></div></form></div>}
    {deleteTarget && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}><div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="modal-head"><div><div className="eyebrow">CONFIRM REMOVAL</div><h2 id="delete-title">{deleteTarget.kind === "client" ? "Delete this client?" : deleteTarget.kind === "lead" ? "Delete this lead?" : deleteTarget.kind === "role" ? "Delete this role?" : "Remove this member?"}</h2><p>{deleteTarget.kind === "client" ? `“${deleteTarget.name}” and its onboarding tasks will be removed from the workspace.` : deleteTarget.kind === "lead" ? `“${deleteTarget.name}” will be removed from the workspace’s lead pipeline.` : deleteTarget.kind === "role" ? `“${deleteTarget.name}” will be deleted. Members using this role will become unassigned.` : `“${deleteTarget.name}” will be removed from the workspace’s workspace member list.`}</p></div><button type="button" className="icon-button" onClick={() => setDeleteTarget(null)}><Icon name="close"/></button></div><div className="modal-foot"><span>This action takes effect immediately.</span><button className="button button-quiet" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="button button-danger" onClick={() => deleteTarget.kind === "client" ? deleteClient(deleteTarget.id) : deleteTarget.kind === "lead" ? deleteLead(deleteTarget.id) : deleteTarget.kind === "role" ? deleteRole(deleteTarget.id) : deleteMember(deleteTarget.id)}><Icon name="trash" size={15}/> {deleteTarget.kind === "client" ? "Delete client" : deleteTarget.kind === "lead" ? "Delete lead" : deleteTarget.kind === "role" ? "Delete role" : "Remove member"}</button></div></div></div>}
    {notice && <div className="toast"><span className="toast-check">✓</span>{notice}</div>}
  </div>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function Avatar({ initials, tone = "mint" }: { initials: string; tone?: string }) { return <div className={`avatar avatar-${tone}`}>{initials}</div>; }
function Status({ children }: { children: string }) { const slug = children.toLowerCase().replaceAll(" ", "-"); return <span className={`status status-${slug}`}><i/>{children}</span>; }
function Overview({ clients, tasks, leads, leadStages, activeClients, mrr, onNavigate, onNew, onTaskMove }: { clients: Client[]; tasks: Task[]; leads: Lead[]; leadStages: string[]; activeClients: number; mrr: number; onNavigate: (s: string) => void; onNew: () => void; onTaskMove: (id: string, status: string) => void }) {
  const todo = tasks.filter(t => t.status !== "Done");
  const visible = [...todo].sort((a,b) => (a.due === "Today" ? -1 : b.due === "Today" ? 1 : 0)).slice(0,5);
  return <>
    <PageHeading eyebrow="FRIDAY, OCTOBER 23, 2026" title="Good morning, Hrushikesh" description="Here’s what’s happening across your client work today." action={<button className="button button-dark" onClick={onNew}><Icon name="plus" size={16}/> New client</button>}/>
    <section className="metric-grid"><Metric icon="users" label="Active clients" value={String(activeClients).padStart(2,"0")} note="Across assigned accounts" trend="Current count" color="green"/><Metric icon="chart" label="Monthly retainer" value={money(mrr)} note="Contracted monthly revenue" trend="Current total" color="blue"/><Metric icon="check" label="Open tasks" value={String(todo.length).padStart(2,"0")} note="Across accessible client work" trend={`${tasks.filter(t=>t.status === "Done").length} completed`} color="orange"/><Metric icon="funnel" label="Open opportunities" value={money(leads.reduce((a,l)=>a+l.value,0))} note={`${leads.length} leads in pipeline`} trend="Current total" color="violet"/></section>
    <section className="content-grid"><div className="panel task-panel"><div className="panel-head"><div><h2>Priority tasks</h2><p>What needs your attention next</p></div><button className="text-link" onClick={() => onNavigate("Onboarding")}>View all <Icon name="arrow" size={15}/></button></div><div className="task-list">{visible.map((task,i)=><div className="task-row" key={task.id}><button className={`task-check ${task.status === "Done" ? "checked" : ""}`} onClick={()=>onTaskMove(task.id, task.status === "Done" ? "To do" : "Done")} aria-label="Toggle task complete">{task.status === "Done" ? "✓" : ""}</button><div className="task-main"><strong>{task.title}</strong><span>{task.client}<b>·</b>{task.section}</span></div><Avatar initials={task.owner.split(" ").map(w=>w[0]).join("").slice(0,2)} tone={["mint","lilac","peach","blue","rose"][i%5]}/><span className={`due ${task.due === "Today" ? "due-now" : ""}`}>{task.due === "Today" && <i/>}{task.due}</span></div>)}</div><div className="panel-footer"><span>{todo.length} tasks across all clients</span><button className="text-link" onClick={()=>onNavigate("Client content")}>Open client content <Icon name="arrow" size={15}/></button></div></div>
    <div className="panel portfolio-panel"><div className="panel-head"><div><h2>Client portfolio</h2><p>Quick look at your accounts</p></div><button className="icon-button subtle" aria-label="More" onClick={()=>onNavigate("Clients")}><Icon name="more"/></button></div><div className="portfolio-list">{clients.slice(0,5).map(c=><div className="portfolio-row" key={c.id}><Avatar initials={c.initials} tone={c.tone}/><div className="portfolio-name"><strong>{c.name}</strong><span>{c.offer}</span></div><div className="portfolio-value"><b>{money(c.retainer)}</b><Status>{c.status}</Status></div></div>)}</div><div className="panel-footer"><span>{activeClients} active engagements</span><button className="text-link" onClick={()=>onNavigate("Clients")}>All clients <Icon name="arrow" size={15}/></button></div></div></section>
    <section className="bottom-grid"><div className="panel pipeline-panel"><div className="panel-head"><div><h2>Pipeline snapshot</h2><p>New business at a glance</p></div><button className="text-link" onClick={()=>onNavigate("Lead pipeline")}>Open pipeline <Icon name="arrow" size={15}/></button></div><div className="pipeline-stats">{leadStages.slice(0,4).map((stage,i)=>{const count=leads.filter(l=>l.stage===stage).length;const max=Math.max(1,...leadStages.map(item=>leads.filter(lead=>lead.stage===item).length));return <div className="pipe-stat" key={stage}><span>{stage}</span><strong>{count}</strong><div className="pipe-line"><i style={{width:`${Math.round(count/max*100)}%`}}/></div></div>})}</div></div><div className="panel launch-panel"><div className="launch-orbit orbit-one"/><div className="launch-orbit orbit-two"/><div className="launch-content"><span className="launch-tag">OVYRO OPERATIONS</span><h2>Good work<br/>moves forward.</h2><p>Keep every client, deliverable, and opportunity in sync.</p><button onClick={()=>onNavigate("Onboarding")}>See onboarding flow <Icon name="arrow" size={15}/></button></div><div className="launch-monogram">O</div></div></section>
  </>;
}
function Metric({ icon, label, value, note, trend, color }: { icon: string; label: string; value: string; note: string; trend: string; color: string }) { return <div className="metric-card"><div className="metric-top"><span className={`metric-icon ${color}`}><Icon name={icon} size={17}/></span><span className="metric-trend"><Icon name="trend" size={13}/>{trend}</span></div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-note">{note}</div></div>; }

function ClientsPage({ clients, onNew, onEdit, onDelete, query }: { clients: Client[]; onNew: () => void; onEdit: (client: Client) => void; onDelete: (client: Client) => void; query: string }) {
  return <>
    <PageHeading eyebrow="YOUR ACCOUNTS" title="Clients" description="Every partnership, organized in one place." action={<button className="button button-dark" onClick={onNew}><Icon name="plus" size={16}/> New client</button>}/>
    <div className="toolbar"><div className="view-tabs"><button className="active">All clients <span>{clients.length}</span></button><button>Active</button><button>Onboarding</button><button>Paused</button></div><span className="toolbar-note">{query ? `Search results for “${query}”` : "Sorted by recently added"}</span></div>
    <div className="panel table-panel"><table><thead><tr><th>CLIENT</th><th>STATUS</th><th>MONTHLY RETAINER</th><th>ACCOUNT OWNER</th><th>START DATE</th><th>ACTIONS</th></tr></thead><tbody>{clients.map(c=><tr key={c.id}><td><div className="table-client"><Avatar initials={c.initials} tone={c.tone}/><div><strong>{c.name}</strong><span>{c.id} <b>·</b> {c.offer}</span></div></div></td><td><Status>{c.status}</Status></td><td><strong className="table-money">{money(c.retainer)}</strong><span className="table-sub">INR / month</span></td><td><div className="owner-cell"><Avatar initials={c.owner.split(" ").map(w=>w[0]).join("").slice(0,2)} tone="ink"/><span>{c.owner}</span></div></td><td className="date-cell">{c.started}</td><td><div className="row-actions"><button className="row-action" title={`Edit ${c.name}`} aria-label={`Edit ${c.name}`} onClick={()=>onEdit(c)}><Icon name="edit" size={15}/></button><button className="row-action danger-action" title={`Delete ${c.name}`} aria-label={`Delete ${c.name}`} onClick={()=>onDelete(c)}><Icon name="trash" size={15}/></button></div></td></tr>)}</tbody></table>{clients.length===0&&<div className="empty-state">No clients found. Add a client to start a workspace.</div>}</div>
  </>;
}

function OnboardingPage({ tasks, sections, onMove, clients }: { tasks: Task[]; sections: string[]; onMove: (id:string,status:string)=>void; clients: Client[] }) {
  const [filter,setFilter]=useState("All clients");
  const names=["All clients",...clients.map(c=>c.name)];
  const shown=tasks.filter(t=>filter==="All clients"||t.client===filter);
  const orderedSections=[...sections,...Array.from(new Set(shown.map(task=>task.section).filter(section=>!sections.includes(section))))];
  return <><PageHeading eyebrow="CLIENT DELIVERY" title="Client onboarding" description="A clear path from signed agreement to launch-ready campaign." action={<button className="button button-quiet" onClick={()=>{const next=shown.find(task=>task.status!=="Done");if(next)onMove(next.id,"Done")}} disabled={!shown.some(task=>task.status!=="Done")}>✓ Mark next task done</button>}/><div className="toolbar"><div className="view-tabs"><button className="active">Task list <span>{shown.filter(t=>t.status!=="Done").length}</span></button></div><select className="select-filter" value={filter} onChange={e=>setFilter(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select></div><div className="onboarding-timeline">{orderedSections.map((section,index)=>{const group=shown.filter(t=>t.section===section);return <section className="timeline-group" key={section}><div className="timeline-marker"><span>{String(index+1).padStart(2,"0")}</span><i/></div><div className="timeline-content"><div className="timeline-title"><div><h2>{section}</h2><p>{section==="Landing Page Development"?"Domain connection, funnel build, code, pixel, events & WhatsApp setup":"Tasks for the client and internal team"}</p></div><span className="task-count">{group.filter(t=>t.status==="Done").length}/{group.length}</span></div><div className="panel onboarding-task-panel">{group.length ? group.map(t=><div className="onboarding-task" key={t.id}><button className={`task-check ${t.status==="Done"?"checked":""}`} onClick={()=>onMove(t.id,t.status==="Done"?"To do":"Done")} aria-label={`${t.status==="Done"?"Reopen":"Complete"} ${t.title}`}>{t.status==="Done"?"✓":""}</button><div className="onboard-task-info"><strong>{t.title}</strong><span>{t.client} <b>·</b> Owner: {t.owner}</span></div><span className="due">{t.due}</span><select className="status-select" value={t.status} onChange={e=>onMove(t.id,e.target.value)} aria-label={`Status for ${t.title}`}>{taskStatuses.map(status=><option key={status}>{status}</option>)}</select></div>):<div className="onboarding-empty-section">No tasks in this section yet.</div>}</div></div></section>})}</div></>;
}

function LeadsPage({ leads, stages, onMove, onNew, onEdit, onDelete, onAddStage, onRenameStage, onDeleteStage }: { leads: Lead[]; stages: string[]; onMove:(name:string,stage:string)=>void; onNew:()=>void; onEdit:(lead:Lead)=>void; onDelete:(lead:Lead)=>void; onAddStage:(stage:string)=>boolean; onRenameStage:(stage:string,next:string)=>void; onDeleteStage:(stage:string)=>void }) {
  const [managingStages, setManagingStages] = useState(false);
  const [newStage, setNewStage] = useState("");
  const [stageDrafts, setStageDrafts] = useState<Record<string,string>>({});
  const saveStage = (stage:string) => { const draft=stageDrafts[stage]; if (draft?.trim() && draft.trim()!==stage) onRenameStage(stage,draft); setStageDrafts(current=>{const next={...current}; delete next[stage]; return next;}); };
  return <><PageHeading eyebrow="NEW BUSINESS" title="Lead pipeline" description="Track every opportunity from first conversation to close." action={<div className="heading-actions"><button className="button button-quiet" onClick={()=>setManagingStages(value=>!value)}>{managingStages?"Done":"Manage stages"}</button><button className="button button-dark" onClick={onNew}><Icon name="plus" size={16}/> Add lead</button></div>}/><div className="pipeline-summary"><span><strong>{leads.length}</strong> open opportunities</span><b>{money(leads.reduce((a,l)=>a+l.value,0))} <small>potential MRR</small></b></div>
  {managingStages&&<section className="panel stage-manager"><div className="panel-head"><div><h2>Customize pipeline stages</h2><p>Rename stages or remove empty stages. Leads in a stage must be moved before it can be removed.</p></div></div><div className="stage-manager-list">{stages.map(stage=><div className="stage-manager-row" key={stage}><input aria-label={`Stage name ${stage}`} value={stageDrafts[stage]??stage} onChange={event=>setStageDrafts({...stageDrafts,[stage]:event.target.value})} onBlur={()=>saveStage(stage)} onKeyDown={event=>{if(event.key==="Enter") {event.preventDefault(); saveStage(stage);}}}/><span>{leads.filter(lead=>lead.stage===stage).length} leads</span><button type="button" className="row-action danger-action" aria-label={`Delete ${stage}`} title={leads.some(lead=>lead.stage===stage)?"Move leads out before deleting":"Delete stage"} onClick={()=>onDeleteStage(stage)} disabled={leads.some(lead=>lead.stage===stage)||stages.length<=1}><Icon name="trash" size={14}/></button></div>)}<form className="stage-manager-add" onSubmit={event=>{event.preventDefault(); if(onAddStage(newStage))setNewStage("");}}><input value={newStage} onChange={event=>setNewStage(event.target.value)} placeholder="New stage name" aria-label="New stage name"/><button className="button button-dark" type="submit" disabled={!newStage.trim()}><Icon name="plus" size={14}/> Add stage</button></form></div></section>}
  <div className="lead-stage-grid" style={{gridTemplateColumns:`repeat(${Math.max(stages.length,1)}, minmax(175px,1fr))`}}>{stages.map((stage,i)=>{const items=leads.filter(l=>l.stage===stage);return <div className="lead-stage" key={stage}><div className="stage-head"><span className={`stage-dot dot-${i%5}`}/><strong>{stage}</strong><span className="stage-count">{items.length}</span></div><div className="stage-cards">{items.map(l=><article className="lead-card" key={l.name}><div className="lead-card-top"><Avatar initials={l.initials} tone={l.tone}/><div className="lead-actions"><button className="icon-button subtle" aria-label={`Edit ${l.company}`} title="Edit lead" onClick={()=>onEdit(l)}><Icon name="edit" size={15}/></button><button className="icon-button subtle" aria-label={`Delete ${l.company}`} title="Delete lead" onClick={()=>onDelete(l)}><Icon name="trash" size={15}/></button></div></div><strong>{l.company}</strong><span className="lead-person">{l.name}</span><div className="lead-card-foot"><span>{l.source}</span><b>{money(l.value)}<small>/mo</small></b></div><select value={l.stage} onChange={e=>onMove(l.name,e.target.value)} aria-label={`Move ${l.company} to stage`}>{stages.map(s=><option key={s}>{s}</option>)}</select></article>)}{items.length===0&&<div className="stage-empty">No leads here yet</div>}</div></div>})}</div></>;
}

function ClientContentPage({ clients, cards, selectedClientId, onSelectClient, onAdd, onEdit }: { clients: Client[]; cards: ContentCard[]; selectedClientId: string; onSelectClient: (id:string)=>void; onAdd:()=>void; onEdit:(card:ContentCard)=>void }) {
  const client = clients.find(item => item.id === selectedClientId);
  const visible = cards.filter(card => card.clientId === selectedClientId);
  return <><PageHeading eyebrow="CREATIVE WORKSPACE" title="Client content" description="Plan and manage ad concepts, scripts, and creative deliverables independently for each client." action={<button className="button button-dark" onClick={onAdd} disabled={!client}><Icon name="plus" size={16}/> Add content</button>}/>{clients.length === 0 ? <div className="panel resources-empty"><div className="resource-empty-icon"><Icon name="users" size={24}/></div><h2>Add a client to get started</h2><p>Each client will have a separate content workspace here.</p></div> : <><div className="content-client-picker"><div><span className="eyebrow">CLIENT WORKSPACE</span><strong>{client?.name ?? "Select a client"}</strong><small>{visible.length} content {visible.length === 1 ? "item" : "items"}</small></div><label className="select-filter-label">Client<select className="select-filter" value={selectedClientId} onChange={e=>onSelectClient(e.target.value)}>{clients.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="content-board-intro"><div><h2>{client?.name} · Ad creative</h2><p>Only content assigned to this client appears in this workspace.</p></div><span className="content-isolated-pill"><Icon name="shield" size={14}/> Separate from onboarding</span></div><div className="content-stage-grid">{contentStatuses.map((status,i)=>{const items=visible.filter(card=>card.status===status);return <section className="content-stage" key={status}><div className="content-stage-head"><span className={`column-indicator col-${i%5}`}/><strong>{status}</strong><span>{items.length}</span></div><div className="content-stage-cards">{items.map(card=><article className="content-card" key={card.id}><div className="content-card-tags"><span>{card.platform}</span><button className="row-action" title={`Edit ${card.title}`} aria-label={`Edit ${card.title}`} onClick={()=>onEdit(card)}><Icon name="edit" size={14}/></button></div><h3>{card.title}</h3><p>{card.format || "Ad creative"}</p>{card.copy && <div className="content-copy-preview">{card.copy}</div>}<div className="content-card-foot"><small>Updated {card.updated}</small>{card.assetUrl && <a href={card.assetUrl} target="_blank" rel="noreferrer">View asset <Icon name="arrow" size={12}/></a>}</div></article>)}{items.length===0&&<div className="content-stage-empty">No content here</div>}</div></section>})}</div></>}</>;
}


function TeamPage({ roles, setRoles, roleTabOptions, newRole, setNewRole, members, accountsConnected, onInvite, onEditMember, onDeleteMember, onEditRole, onDeleteRole }: { roles: WorkspaceRole[]; setRoles: (r: WorkspaceRole[]) => void; roleTabOptions: string[]; newRole: string; setNewRole: (s: string) => void; members: TeamMember[]; accountsConnected: boolean; onInvite: () => void; onEditMember: (member: TeamMember) => void; onDeleteMember: (member: TeamMember) => void; onEditRole: (index: number) => void; onDeleteRole: (role: WorkspaceRole) => void }) {
  return <>
    <PageHeading eyebrow="WORKSPACE ADMIN" title="Team & access" description="Manage who can see and work on OVYRO client accounts." action={<button className="button button-dark" onClick={onInvite} disabled={!accountsConnected}><Icon name="plus" size={16}/> Add member</button>}/>
    <div className="access-banner"><span className="banner-icon"><Icon name="shield"/></span><div><strong>Access is scoped to client work</strong><p>Choose allowed tabs on each role, then assign client scope on each member.</p></div><span className="secure-pill">● Private workspace</span></div>
    <div className="team-section-head"><div><h2>Roles & permissions</h2><p>Configure access levels for your internal team.</p></div><span className="small-label">{roles.length} ROLES</span></div>
    <div className="role-grid">{roles.map((r,i)=><article className="role-card" key={r.name}><div className="role-card-head"><div className={`role-icon role-${i%3}`}><Icon name={i===0?"shield":i===1?"users":"board"}/></div></div><h3>{r.name}</h3><p className="role-tabs-summary">Tabs: {r.tabs.join(", ") || "No tabs selected"}</p><div className="role-card-foot"><span>{r.users}</span><div className="role-card-actions"><button className="text-link" onClick={()=>onEditRole(i)}><Icon name="edit" size={13}/> Edit</button><button className="row-action danger-action" title={`Delete ${r.name}`} aria-label={`Delete ${r.name}`} onClick={()=>onDeleteRole(r)}><Icon name="trash" size={14}/></button></div></div></article>)}</div>
    <div className="panel members-panel"><div className="panel-head"><div><h2>Workspace members</h2><p>People with access to the internal workspace</p></div><button className="text-link" onClick={onInvite} disabled={!accountsConnected}>Add a teammate <Icon name="arrow" size={15}/></button></div>{members.map(member=><div className="member-row" key={member.id}><Avatar initials={member.initials} tone={member.tone}/><div className="member-name"><strong>{member.name}</strong><span>{member.email}</span></div><span className="member-scope">{member.role} · {member.scope}</span><span className={`member-active ${member.status === "Invite pending" ? "member-pending" : ""}`}><i/> {member.status}</span>{member.id !== "owner" && <div className="row-actions"><button className="row-action" title={`Edit ${member.name}`} aria-label={`Edit ${member.name}`} disabled={!accountsConnected} onClick={()=>onEditMember(member)}><Icon name="edit" size={15}/></button><button className="row-action danger-action" title={`Remove ${member.name}`} aria-label={`Remove ${member.name}`} disabled={!accountsConnected} onClick={()=>onDeleteMember(member)}><Icon name="trash" size={15}/></button></div>}</div>)}</div>
    <div className="create-role-row"><div><strong>Create a custom role</strong><span>Choose its tabs by editing the role after creation.</span></div><div className="create-role-input"><input value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="e.g. Copywriter"/><button className="button button-dark" onClick={()=>{if(newRole.trim()&&!roles.some(role=>role.name.toLowerCase()===newRole.trim().toLowerCase())){setRoles([...roles,{name:newRole.trim(),access:roleTabOptions.join(" · "),users:"0 members",tabs:roleTabOptions}]);setNewRole("");}}}><Icon name="plus" size={15}/> Create role</button></div></div>
  </>;
}

function ResourcesPage({ resources, clients, onNew, onEdit }: { resources: Resource[]; clients: Client[]; onNew: () => void; onEdit: (resource: Resource) => void }) {
  const [filter, setFilter] = useState("All resources");
  const [clientFilter, setClientFilter] = useState("All clients");
  const filtered = resources.filter(r => (filter === "All resources" || (filter === "Company-wide" ? r.scope !== "Client" : r.scope === "Client")) && (filter !== "Client-specific" || clientFilter === "All clients" || r.clientId === clientFilter));
  const company = filtered.filter(r => r.scope !== "Client");
  const clientGroups = clients.map(client => ({ client, items: filtered.filter(r => r.scope === "Client" && r.clientId === client.id) })).filter(group => group.items.length);
  const renderCards = (items: Resource[]) => <div className="resource-grid">{items.map(r => <article className="panel resource-card" key={r.id}><div className="resource-card-icon"><Icon name={r.fileName ? "check" : "arrow"} size={18}/></div><button className="button button-quiet resource-edit" onClick={() => onEdit(r)}><Icon name="edit" size={14}/> Edit</button><h2>{r.title}</h2><p>{r.description || "Shared workspace resource"}</p><div className="resource-meta"><span className={`resource-pill ${r.scope === "Client" ? "resource-pill-client" : ""}`}>{r.scope === "Client" ? clients.find(c => c.id === r.clientId)?.name ?? "Client resource" : "Company-wide"}</span><small>{r.audience} · Updated {r.updated}</small></div><a className="button button-dark resource-open" href={r.fileData || r.url} target="_blank" rel="noreferrer" download={r.fileData ? r.fileName : undefined}><Icon name="arrow" size={14}/>{r.fileName ? `Open ${r.fileName}` : "Open link"}</a></article>)}</div>;
  return <><PageHeading eyebrow="SHARED KNOWLEDGE" title="Resources" description="One library for company-wide materials and resources organized under each client." action={<button className="button button-dark" onClick={onNew}><Icon name="plus" size={16}/> Add resource</button>}/><div className="resource-access-note"><Icon name="shield" size={17}/><span>Company resources are for the whole workspace. Client resources are grouped under the selected client.</span></div><div className="resource-library-toolbar"><div className="view-tabs">{["All resources", "Company-wide", "Client-specific"].map(item=><button key={item} className={filter===item?"active":""} onClick={()=>setFilter(item)}>{item}<span>{item==="All resources"?resources.length:item==="Company-wide"?resources.filter(r=>r.scope!=="Client").length:resources.filter(r=>r.scope==="Client").length}</span></button>)}</div>{filter === "Client-specific" && <select className="select-filter" value={clientFilter} onChange={e=>setClientFilter(e.target.value)}><option>All clients</option>{clients.map(client=><option key={client.id} value={client.id}>{client.name}</option>)}</select>}</div>{filtered.length === 0 ? <div className="panel resources-empty"><div className="resource-empty-icon"><Icon name="folder" size={24}/></div><h2>{filter === "Client-specific" ? "No client resources yet" : filter === "Company-wide" ? "No company resources yet" : "Your shared library starts here"}</h2><p>Add a file or Drive link and choose whether it belongs to the company or a specific client.</p><button className="button button-quiet" onClick={onNew}><Icon name="plus" size={15}/> Add your first resource</button></div> : <div className="resource-library-groups">{company.length > 0 && <section><div className="resource-group-heading"><h2>Company-wide resources</h2><span>{company.length}</span></div>{renderCards(company)}</section>}{clientGroups.map(group=><section key={group.client.id}><div className="resource-group-heading"><h2>{group.client.name}</h2><span>{group.items.length} client {group.items.length===1?"resource":"resources"}</span></div>{renderCards(group.items)}</section>)}</div>}</>;
}

function RevenuePage({clients}:{clients:Client[]}) {
  const active=clients.filter(c=>c.status==="Active"||c.status==="Onboarding");
  const total=active.reduce((a,c)=>a+c.retainer,0);
  return <><PageHeading eyebrow="FINANCE OVERVIEW" title="Revenue tracking" description="Review contracted monthly retainers for your accessible clients."/><div className="metric-grid revenue-metrics"><Metric icon="chart" label="Contracted MRR" value={money(total)} note="Calculated from active client retainers" trend={`${active.length} active clients`} color="green"/><Metric icon="users" label="Retainer clients" value={String(active.length)} note="Active and onboarding accounts" trend="Current workspace data" color="blue"/></div><div className="panel table-panel revenue-table"><div className="panel-head"><div><h2>Client retainers</h2><p>Monthly contracted revenue by client</p></div><span className="secure-pill">INR</span></div><table><thead><tr><th>CLIENT</th><th>STATUS</th><th>MONTHLY RETAINER</th></tr></thead><tbody>{active.map(c=><tr key={c.id}><td><div className="table-client"><Avatar initials={c.initials} tone={c.tone}/><div><strong>{c.name}</strong><span>{c.id}</span></div></div></td><td><Status>{c.status}</Status></td><td><strong className="table-money">{money(c.retainer)}</strong></td></tr>)}</tbody></table>{active.length===0&&<div className="empty-state">No active client retainers in your scope.</div>}</div></>;
}

function SettingsPage({ onNavigate, workflow, setWorkflow, sections, setSections, workspaceProfile, setWorkspaceProfile }: { onNavigate: (page:string)=>void; workflow:WorkflowStep[]; setWorkflow:(steps:WorkflowStep[])=>void; sections:string[]; setSections:(items:string[])=>void; workspaceProfile:{name:string;email:string}; setWorkspaceProfile:(profile:{name:string;email:string})=>void }) {
  const [tab,setTab]=useState("Workspace profile");
  const [newSection,setNewSection]=useState("");
  const [sectionDrafts,setSectionDrafts]=useState<Record<string,string>>({});
  const [subtaskDrafts,setSubtaskDrafts]=useState<Record<string,string>>({});
  const tabs=[{name:"Workspace profile",icon:"settings"},{name:"Onboarding workflow",icon:"check"},{name:"Access & security",icon:"shield"}];
  const normalize=(steps:WorkflowStep[],orderedSections=sections)=>orderedSections.flatMap(section=>steps.filter(step=>step.section===section));
  const renameSection=(section:string,value:string)=>{const next=value.trim();if(!next||sections.some(item=>item!==section&&item.toLowerCase()===next.toLowerCase()))return;const nextSections=sections.map(item=>item===section?next:item);setSections(nextSections);setWorkflow(normalize(workflow.map(step=>step.section===section?{...step,section:next}:step),nextSections));};
  const removeSection=(section:string)=>{if(sections.length<=1)return;const nextSections=sections.filter(item=>item!==section);setSections(nextSections);setWorkflow(normalize(workflow.filter(step=>step.section!==section),nextSections));};
  const createSection=()=>{const next=newSection.trim();if(!next||sections.some(item=>item.toLowerCase()===next.toLowerCase()))return;const nextSections=[...sections,next];setSections(nextSections);setWorkflow(normalize(workflow,nextSections));setNewSection("");};
  const addSubtask=(section:string)=>{const title=(subtaskDrafts[section]??"").trim();if(!title)return;setWorkflow(normalize([...workflow,{id:`workflow-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title,section,enabled:true}]));setSubtaskDrafts({...subtaskDrafts,[section]:""});};
  const moveSection=(source:string,target:string)=>{if(source===target)return;const next=[...sections];const from=next.indexOf(source),to=next.indexOf(target);if(from<0||to<0)return;next.splice(from,1);next.splice(to,0,source);setSections(next);setWorkflow(normalize(workflow,next));};
  const moveSubtask=(sourceId:string,targetSection:string,targetId?:string)=>{if(sourceId===targetId)return;const moving=workflow.find(step=>step.id===sourceId);if(!moving)return;const nextSteps=workflow.filter(step=>step.id!==sourceId);const inTarget=nextSteps.filter(step=>step.section===targetSection);const targetIndex=targetId?inTarget.findIndex(step=>step.id===targetId):inTarget.length;inTarget.splice(targetIndex<0?inTarget.length:targetIndex,0,{...moving,section:targetSection});const merged=[...nextSteps.filter(step=>step.section!==targetSection),...inTarget];setWorkflow(normalize(merged));};
  const onSectionDrop=(event:React.DragEvent,section:string)=>{event.preventDefault();const value=event.dataTransfer.getData("text/plain");if(value.startsWith("section:"))moveSection(value.slice(8),section);else if(value.startsWith("task:"))moveSubtask(value.slice(5),section);};
  const onTaskDrop=(event:React.DragEvent,section:string,targetId:string)=>{event.preventDefault();event.stopPropagation();const value=event.dataTransfer.getData("text/plain");if(value.startsWith("task:"))moveSubtask(value.slice(5),section,targetId);};
  const moveSectionBy=(index:number,direction:number)=>{const target=index+direction;if(target<0||target>=sections.length)return;const next=[...sections];[next[index],next[target]]=[next[target],next[index]];setSections(next);setWorkflow(normalize(workflow,next));};
  const moveTaskBy=(step:WorkflowStep,direction:number)=>{const same=workflow.filter(item=>item.section===step.section);const index=same.findIndex(item=>item.id===step.id),target=index+direction;if(target<0||target>=same.length)return;[same[index],same[target]]=[same[target],same[index]];setWorkflow(normalize([...workflow.filter(item=>item.section!==step.section),...same]));};
  return <><PageHeading eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Manage your OVYRO operations workspace."/><div className="settings-layout"><div className="settings-nav">{tabs.map(item=><button key={item.name} className={tab===item.name?"active":""} onClick={()=>setTab(item.name)}><Icon name={item.icon}/>{item.name}</button>)}</div><div className="panel settings-panel">
    {tab==="Workspace profile"&&<><div className="panel-head"><div><h2>Workspace profile</h2><p>Identity and defaults used across your workspace.</p></div></div><div className="settings-fields"><label className="field-label">Workspace name<input value={workspaceProfile.name} onChange={e=>setWorkspaceProfile({...workspaceProfile,name:e.target.value})}/></label><label className="field-label">Workspace email<input type="email" value={workspaceProfile.email} onChange={e=>setWorkspaceProfile({...workspaceProfile,email:e.target.value})}/></label><label className="field-label">Workspace currency<input value="INR · Indian rupee" readOnly /></label></div></>}
    {tab==="Onboarding workflow"&&<><div className="panel-head"><div><h2>Onboarding workflow</h2><p>Arrange sections and subtasks for future client checklists.</p></div><span className="secure-pill">{sections.length} sections · {workflow.length} subtasks</span></div><div className="workflow-editor"><div className="settings-note workflow-editor-note"><strong>Drag to arrange your template</strong><span>Changes apply to new client checklists. Existing client tasks stay in place. Drag a subtask into another section, or use the arrow controls.</span></div><div className="workflow-sections-list">{sections.map((section,index)=>{const steps=workflow.filter(step=>step.section===section);return <section className="workflow-section-card" key={section} onDragOver={event=>event.preventDefault()} onDrop={event=>onSectionDrop(event,section)}><header className="workflow-section-head"><button type="button" className="workflow-drag-handle" draggable aria-label={`Drag section ${section}`} title="Drag to reorder section" onDragStart={event=>{event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",`section:${section}`);}}><span>⠿</span></button><input aria-label="Section name" value={sectionDrafts[section]??section} onChange={event=>setSectionDrafts({...sectionDrafts,[section]:event.target.value})} onBlur={event=>{renameSection(section,event.currentTarget.value);setSectionDrafts(current=>{const next={...current};delete next[section];return next;});}}/><span className="workflow-section-count">{steps.length} {steps.length===1?"subtask":"subtasks"}</span><div className="workflow-order-actions"><button type="button" aria-label={`Move ${section} up`} disabled={index===0} onClick={()=>moveSectionBy(index,-1)}>↑</button><button type="button" aria-label={`Move ${section} down`} disabled={index===sections.length-1} onClick={()=>moveSectionBy(index,1)}>↓</button></div><button type="button" className="row-action danger-action" aria-label={`Remove ${section} and its template subtasks`} title="Remove section and its subtasks" disabled={sections.length<=1} onClick={()=>removeSection(section)}><Icon name="trash" size={14}/></button></header><div className="workflow-subtasks">{steps.map((step,stepIndex)=><div className={`workflow-template-row ${step.enabled?"":"workflow-disabled"}`} key={step.id} onDragOver={event=>event.preventDefault()} onDrop={event=>onTaskDrop(event,section,step.id)}><button type="button" className="workflow-drag-handle workflow-task-grip" draggable aria-label={`Drag subtask ${step.title}`} title="Drag to reorder or move section" onDragStart={event=>{event.stopPropagation();event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",`task:${step.id}`);}}>⠿</button><button type="button" className={`task-check ${step.enabled?"checked":""}`} aria-label={`${step.enabled?"Disable":"Enable"} ${step.title}`} onClick={()=>setWorkflow(workflow.map(item=>item.id===step.id?{...item,enabled:!item.enabled}:item))}>{step.enabled?"✓":""}</button><input aria-label="Subtask name" value={step.title} onChange={event=>setWorkflow(workflow.map(item=>item.id===step.id?{...item,title:event.target.value}:item))}/><div className="workflow-order-actions"><button type="button" aria-label={`Move ${step.title} up`} disabled={stepIndex===0} onClick={()=>moveTaskBy(step,-1)}>↑</button><button type="button" aria-label={`Move ${step.title} down`} disabled={stepIndex===steps.length-1} onClick={()=>moveTaskBy(step,1)}>↓</button></div><button type="button" className="row-action danger-action" title={`Remove ${step.title}`} aria-label={`Remove ${step.title}`} onClick={()=>setWorkflow(workflow.filter(item=>item.id!==step.id))}><Icon name="trash" size={14}/></button></div>)}</div><form className="workflow-add-subtask" onSubmit={event=>{event.preventDefault();addSubtask(section);}}><input aria-label={`New subtask for ${section}`} value={subtaskDrafts[section]??""} onChange={event=>setSubtaskDrafts({...subtaskDrafts,[section]:event.target.value})} placeholder={`Add a subtask to ${section}`}/><button className="button button-quiet" type="submit" disabled={!(subtaskDrafts[section]??"").trim()}><Icon name="plus" size={14}/> Add subtask</button></form></section>})}</div><form className="workflow-add-section" onSubmit={event=>{event.preventDefault();createSection();}}><div><strong>Add a section</strong><span>Sections can be reordered by dragging their handle.</span></div><input value={newSection} onChange={event=>setNewSection(event.target.value)} placeholder="e.g. Campaign launch" aria-label="New section name"/><button className="button button-dark" type="submit" disabled={!newSection.trim()}><Icon name="plus" size={15}/> Add section</button></form></div></>}
    {tab==="Access & security"&&<><div className="panel-head"><div><h2>Access & security</h2><p>Manage workspace membership and resource access.</p></div></div><div className="settings-fields"><div className="settings-note"><strong>Team account security</strong><span>Workspace members receive the tabs and client scope assigned to their account.</span></div><div className="settings-security-card"><div><strong>Workspace members</strong><span>Manage team login details, roles, and client access.</span></div><button className="button button-quiet" onClick={()=>onNavigate("Team & access")}>Manage team <Icon name="arrow" size={14}/></button></div><div className="settings-security-card"><div><strong>Shared resources</strong><span>Manage files and links, including their intended audience.</span></div><button className="button button-quiet" onClick={()=>onNavigate("Resources")}>Open resources <Icon name="arrow" size={14}/></button></div></div></>}
  </div></div></>;
}

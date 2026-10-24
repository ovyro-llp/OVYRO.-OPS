import { Pool } from "pg";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type TeamAccount = { id: string; name: string; email: string; role: string; clientIds: string[]; tabs: string[]; status: "Active"; createdAt: string };
let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;
let workspaceSchemaReady: Promise<void> | undefined;

// Prefer the URL supplied by Vercel's database integration. DATABASE_URL
// remains the fallback for local development and other deployment platforms.
export function getDatabaseUrl() {
  const connectionString = process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) return undefined;

  // pg-connection-string currently treats sslmode=require as verify-full,
  // while Supabase's serverless guidance uses require for encrypted TLS
  // without CA validation. Opt into libpq-compatible semantics explicitly.
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("sslmode")?.toLowerCase() === "require" && !url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

function getPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL is required for team accounts.");
  if (!pool) pool = new Pool({ connectionString, max: 1 });
  return pool;
}

export async function ensureTeamSchema() {
  schemaReady ??= getPool().query(`CREATE TABLE IF NOT EXISTS ovyro_team_accounts (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL,
    client_ids text[] NOT NULL DEFAULT '{}',
    tabs text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
  )`).then(() => undefined).catch(error => { schemaReady = undefined; throw error; });
  await schemaReady;
}

export async function ensureWorkspaceSchema() {
  await ensureTeamSchema();
  workspaceSchemaReady ??= getPool().query(`CREATE TABLE IF NOT EXISTS ovyro_workspace_state (
    workspace_id text PRIMARY KEY,
    state jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`).then(() => undefined).catch(error => { workspaceSchemaReady = undefined; throw error; });
  await workspaceSchemaReady;
}

export async function getWorkspaceState() {
  await ensureWorkspaceSchema();
  const { rows } = await getPool().query("SELECT state FROM ovyro_workspace_state WHERE workspace_id='ovyro' LIMIT 1");
  return (rows[0]?.state as Record<string, unknown> | undefined) ?? null;
}

export async function initializeWorkspaceState(state: Record<string, unknown>) {
  await ensureWorkspaceSchema();
  await getPool().query("INSERT INTO ovyro_workspace_state(workspace_id,state) VALUES('ovyro',$1::jsonb) ON CONFLICT(workspace_id) DO NOTHING", [JSON.stringify(state)]);
  return getWorkspaceState();
}

export async function replaceWorkspaceState(state: Record<string, unknown>) {
  await ensureWorkspaceSchema();
  const { rows } = await getPool().query("INSERT INTO ovyro_workspace_state(workspace_id,state) VALUES('ovyro',$1::jsonb) ON CONFLICT(workspace_id) DO UPDATE SET state=EXCLUDED.state,updated_at=now() RETURNING state", [JSON.stringify(state)]);
  return rows[0].state as Record<string, unknown>;
}

export async function updateWorkspaceState(transform: (state: Record<string, unknown>) => Record<string, unknown>) {
  await ensureWorkspaceSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT state FROM ovyro_workspace_state WHERE workspace_id='ovyro' FOR UPDATE");
    if (!result.rows[0]) { await client.query("COMMIT"); return null; }
    const next = transform(result.rows[0].state as Record<string, unknown>);
    const saved = await client.query("UPDATE ovyro_workspace_state SET state=$1::jsonb,updated_at=now() WHERE workspace_id='ovyro' RETURNING state", [JSON.stringify(next)]);
    await client.query("COMMIT");
    return saved.rows[0].state as Record<string, unknown>;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyTeamPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!/^[0-9a-f]{32}$/i.test(saltHex ?? "") || !/^[0-9a-f]{128}$/i.test(hashHex ?? "")) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicAccount(row: Record<string, unknown>): TeamAccount {
  return { id: String(row.id), name: String(row.name), email: String(row.email), role: String(row.role), clientIds: (row.client_ids as string[]) ?? [], tabs: (row.tabs as string[]) ?? [], status: "Active", createdAt: new Date(String(row.created_at)).toISOString() };
}

export async function listTeamAccounts() {
  await ensureTeamSchema();
  const { rows } = await getPool().query("SELECT id,name,email,role,client_ids,tabs,created_at FROM ovyro_team_accounts ORDER BY created_at DESC");
  return rows.map(publicAccount);
}

export async function findTeamAccountByEmail(email: string) {
  await ensureTeamSchema();
  const { rows } = await getPool().query("SELECT * FROM ovyro_team_accounts WHERE lower(email)=lower($1) LIMIT 1", [email.trim()]);
  return rows[0] as (Record<string, unknown> & { password_hash: string }) | undefined;
}

export async function findTeamAccountById(id: string) {
  await ensureTeamSchema();
  const { rows } = await getPool().query("SELECT id,name,email,role,client_ids,tabs,created_at FROM ovyro_team_accounts WHERE id=$1 LIMIT 1", [id]);
  return rows[0] ? publicAccount(rows[0]) : undefined;
}

export async function createTeamAccount(input: { id: string; name: string; email: string; password: string; role: string; clientIds: string[]; tabs: string[] }) {
  await ensureTeamSchema();
  const { rows } = await getPool().query("INSERT INTO ovyro_team_accounts(id,name,email,password_hash,role,client_ids,tabs) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,email,role,client_ids,tabs,created_at", [input.id,input.name.trim(),input.email.trim().toLowerCase(),hashPassword(input.password),input.role,input.clientIds,input.tabs]);
  return publicAccount(rows[0]);
}

export async function updateTeamAccount(id: string, input: { name: string; email: string; password?: string; role: string; clientIds: string[]; tabs: string[] }) {
  await ensureTeamSchema();
  const { rows } = await getPool().query("UPDATE ovyro_team_accounts SET name=$2,email=$3,role=$4,client_ids=$5,tabs=$6,password_hash=CASE WHEN $7::text IS NULL THEN password_hash ELSE $7 END WHERE id=$1 RETURNING id,name,email,role,client_ids,tabs,created_at", [id,input.name.trim(),input.email.trim().toLowerCase(),input.role,input.clientIds,input.tabs,input.password ? hashPassword(input.password) : null]);
  return rows[0] ? publicAccount(rows[0]) : undefined;
}

export async function deleteTeamAccount(id: string) {
  await ensureTeamSchema();
  const result = await getPool().query("DELETE FROM ovyro_team_accounts WHERE id=$1", [id]);
  return result.rowCount === 1;
}

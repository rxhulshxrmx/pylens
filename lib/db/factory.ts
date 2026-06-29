import type {
  AgentEvent,
  FactoryProject,
  FactoryState,
  FactoryTicket,
  FeatureSpec,
  FileBlueprint,
  SpecSection,
  TicketPriority,
  TicketStatus,
  TicketType,
} from "@/lib/factory/types"
import { sql } from "./index"

const DEFAULT_PROJECT_NAME = "Software Factory"
const DEFAULT_PROJECT_DESCRIPTION =
  "Agent-assisted workspace for feature specs, file blueprints, tickets, and delivery boards."

let schemaReady = false
let schemaReadyPromise: Promise<void> | null = null

async function ensureFactorySchema() {
  if (schemaReady) return
  if (schemaReadyPromise) return schemaReadyPromise

  schemaReadyPromise = createFactorySchema()
  try {
    await schemaReadyPromise
    schemaReady = true
  } finally {
    schemaReadyPromise = null
  }
}

async function createFactorySchema() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`

  await sql`
    CREATE TABLE IF NOT EXISTS factory_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS factory_specs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES factory_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      source_prompt TEXT NOT NULL,
      sections JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS factory_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES factory_projects(id) ON DELETE CASCADE,
      spec_id UUID REFERENCES factory_specs(id) ON DELETE SET NULL,
      key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Backlog',
      priority TEXT NOT NULL DEFAULT 'P1',
      type TEXT NOT NULL DEFAULT 'Story',
      owner TEXT NOT NULL DEFAULT 'Factory Agent',
      acceptance JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(project_id, key)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS factory_file_blueprints (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES factory_projects(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Proposed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(project_id, path)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS factory_agent_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES factory_projects(id) ON DELETE CASCADE,
      actor TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value) || (value && typeof value === "object")) return value as T
  if (typeof value !== "string") return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function toSpec(row: Record<string, unknown>): FeatureSpec {
  return {
    ...(row as Omit<FeatureSpec, "sections">),
    sections: parseJson<SpecSection[]>(row.sections, []),
  }
}

function toTicket(row: Record<string, unknown>): FactoryTicket {
  return {
    ...(row as Omit<FactoryTicket, "acceptance" | "status" | "priority" | "type">),
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    type: row.type as TicketType,
    acceptance: parseJson<string[]>(row.acceptance, []),
  }
}

export async function getOrCreateDefaultProject(): Promise<FactoryProject> {
  await ensureFactorySchema()
  const existing = await sql`
    SELECT * FROM factory_projects
    ORDER BY updated_at DESC
    LIMIT 1
  `
  if (existing[0]) return existing[0] as FactoryProject

  const rows = await sql`
    INSERT INTO factory_projects (name, description)
    VALUES (${DEFAULT_PROJECT_NAME}, ${DEFAULT_PROJECT_DESCRIPTION})
    RETURNING *
  `
  const project = rows[0] as FactoryProject
  await seedProject(project.id)
  return project
}

export async function listProjects(): Promise<FactoryProject[]> {
  await ensureFactorySchema()
  const rows = await sql`
    SELECT * FROM factory_projects
    ORDER BY updated_at DESC
  `
  return rows as FactoryProject[]
}

async function seedProject(projectId: string) {
  await createAgentEvent(projectId, "agent", "Workspace initialized. Describe the product, then generate the first FS.")
  await createFileBlueprints(projectId, [
    { path: "lib/factory/types.ts", purpose: "Shared project, spec, ticket, file blueprint, and agent event types" },
    { path: "lib/db/factory.ts", purpose: "Neon persistence for factory projects and delivery artifacts" },
    { path: "app/api/factory/route.ts", purpose: "Load the current factory workspace state" },
    { path: "app/api/factory/specs/generate/route.ts", purpose: "Generate feature specs with the planner agent" },
    { path: "app/api/factory/tickets/generate/route.ts", purpose: "Generate tickets with the ticket agent" },
  ])
}

export async function getFactoryState(projectId?: string): Promise<FactoryState> {
  const project = projectId ? await getProject(projectId) : await getOrCreateDefaultProject()
  const [specRows, ticketRows, blueprintRows, eventRows] = await Promise.all([
    sql`SELECT * FROM factory_specs WHERE project_id = ${project.id} ORDER BY updated_at DESC`,
    sql`SELECT * FROM factory_tickets WHERE project_id = ${project.id} ORDER BY created_at DESC`,
    sql`SELECT * FROM factory_file_blueprints WHERE project_id = ${project.id} ORDER BY path ASC`,
    sql`SELECT * FROM factory_agent_events WHERE project_id = ${project.id} ORDER BY created_at DESC LIMIT 50`,
  ])

  return {
    project,
    specs: specRows.map((row) => toSpec(row as Record<string, unknown>)),
    tickets: ticketRows.map((row) => toTicket(row as Record<string, unknown>)),
    fileBlueprints: blueprintRows as FileBlueprint[],
    events: eventRows as AgentEvent[],
  }
}

export async function getProject(projectId: string): Promise<FactoryProject> {
  await ensureFactorySchema()
  const rows = await sql`SELECT * FROM factory_projects WHERE id = ${projectId}`
  if (!rows[0]) throw new Error("Project not found")
  return rows[0] as FactoryProject
}

export async function createProject(name: string, description?: string): Promise<FactoryProject> {
  await ensureFactorySchema()
  const rows = await sql`
    INSERT INTO factory_projects (name, description)
    VALUES (${name}, ${description ?? null})
    RETURNING *
  `
  const project = rows[0] as FactoryProject
  await seedProject(project.id)
  return project
}

export async function updateProject(
  projectId: string,
  input: { name?: string; description?: string | null }
): Promise<FactoryProject> {
  await ensureFactorySchema()
  const current = await getProject(projectId)
  const rows = await sql`
    UPDATE factory_projects
    SET
      name = ${input.name?.trim() || current.name},
      description = ${input.description === undefined ? current.description : input.description},
      updated_at = NOW()
    WHERE id = ${projectId}
    RETURNING *
  `
  return rows[0] as FactoryProject
}

export async function deleteProject(projectId: string): Promise<void> {
  await ensureFactorySchema()
  await sql`DELETE FROM factory_projects WHERE id = ${projectId}`
}

export async function createFeatureSpec(input: {
  projectId: string
  title: string
  summary: string
  sourcePrompt: string
  sections: SpecSection[]
}): Promise<FeatureSpec> {
  await ensureFactorySchema()
  const rows = await sql`
    INSERT INTO factory_specs (project_id, title, summary, source_prompt, sections)
    VALUES (${input.projectId}, ${input.title}, ${input.summary}, ${input.sourcePrompt}, ${JSON.stringify(input.sections)})
    RETURNING *
  `
  await touchProject(input.projectId)
  return toSpec(rows[0] as Record<string, unknown>)
}

export async function getFeatureSpec(specId: string): Promise<FeatureSpec> {
  await ensureFactorySchema()
  const rows = await sql`SELECT * FROM factory_specs WHERE id = ${specId}`
  if (!rows[0]) throw new Error("Feature spec not found")
  return toSpec(rows[0] as Record<string, unknown>)
}

export async function createTickets(
  projectId: string,
  specId: string | null,
  tickets: Array<{
    title: string
    description: string
    priority: TicketPriority
    type: TicketType
    owner: string
    acceptance: string[]
  }>
): Promise<FactoryTicket[]> {
  await ensureFactorySchema()
  const countRows = await sql`
    SELECT COUNT(*)::int AS count FROM factory_tickets WHERE project_id = ${projectId}
  `
  const start = Number(countRows[0]?.count ?? 0) + 1
  const created: FactoryTicket[] = []

  for (const [index, ticket] of tickets.entries()) {
    const key = `FAC-${String(start + index).padStart(3, "0")}`
    const rows = await sql`
      INSERT INTO factory_tickets (
        project_id, spec_id, key, title, description, status, priority, type, owner, acceptance
      )
      VALUES (
        ${projectId}, ${specId}, ${key}, ${ticket.title}, ${ticket.description}, 'Backlog',
        ${ticket.priority}, ${ticket.type}, ${ticket.owner}, ${JSON.stringify(ticket.acceptance)}
      )
      RETURNING *
    `
    created.push(toTicket(rows[0] as Record<string, unknown>))
  }

  await touchProject(projectId)
  return created
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<FactoryTicket> {
  await ensureFactorySchema()
  const rows = await sql`
    UPDATE factory_tickets
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${ticketId}
    RETURNING *
  `
  if (!rows[0]) throw new Error("Ticket not found")
  const ticket = toTicket(rows[0] as Record<string, unknown>)
  await touchProject(ticket.project_id)
  return ticket
}

export async function createFileBlueprints(
  projectId: string,
  blueprints: Array<{ path: string; purpose: string }>
): Promise<FileBlueprint[]> {
  await ensureFactorySchema()
  const created: FileBlueprint[] = []
  for (const blueprint of blueprints) {
    const rows = await sql`
      INSERT INTO factory_file_blueprints (project_id, path, purpose)
      VALUES (${projectId}, ${blueprint.path}, ${blueprint.purpose})
      ON CONFLICT (project_id, path)
      DO UPDATE SET purpose = EXCLUDED.purpose, updated_at = NOW()
      RETURNING *
    `
    created.push(rows[0] as FileBlueprint)
  }
  await touchProject(projectId)
  return created
}

export async function createAgentEvent(
  projectId: string,
  actor: "agent" | "user",
  text: string
): Promise<AgentEvent> {
  await ensureFactorySchema()
  const rows = await sql`
    INSERT INTO factory_agent_events (project_id, actor, text)
    VALUES (${projectId}, ${actor}, ${text})
    RETURNING *
  `
  return rows[0] as AgentEvent
}

async function touchProject(projectId: string) {
  await sql`
    UPDATE factory_projects SET updated_at = NOW()
    WHERE id = ${projectId}
  `
}

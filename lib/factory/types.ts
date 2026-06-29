export type TicketStatus = "Backlog" | "Ready" | "In Progress" | "Review" | "Done"
export type TicketPriority = "P0" | "P1" | "P2"
export type TicketType = "Epic" | "Story" | "Task" | "Bug"

export type FactoryProject = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type SpecSection = {
  title: string
  body: string
}

export type FeatureSpec = {
  id: string
  project_id: string
  title: string
  summary: string
  source_prompt: string
  sections: SpecSection[]
  created_at: string
  updated_at: string
}

export type FactoryTicket = {
  id: string
  project_id: string
  spec_id: string | null
  key: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  owner: string
  acceptance: string[]
  created_at: string
  updated_at: string
}

export type FileBlueprint = {
  id: string
  project_id: string
  path: string
  purpose: string
  status: "Proposed" | "Approved" | "Rejected"
  created_at: string
  updated_at: string
}

export type AgentEvent = {
  id: string
  project_id: string
  actor: "agent" | "user"
  text: string
  created_at: string
}

export type FactoryState = {
  project: FactoryProject
  specs: FeatureSpec[]
  tickets: FactoryTicket[]
  fileBlueprints: FileBlueprint[]
  events: AgentEvent[]
}

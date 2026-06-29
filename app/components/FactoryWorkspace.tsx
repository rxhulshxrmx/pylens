"use client"

import type { AgentEvent, FactoryProject, FactoryState, FactoryTicket, FeatureSpec, TicketStatus } from "@/lib/factory/types"
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderTree,
  GitBranch,
  LayoutDashboard,
  Loader2,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Send,
  Ticket,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type View = "overview" | "specs" | "tickets" | "board" | "files"

const STATUS_ORDER: TicketStatus[] = ["Backlog", "Ready", "In Progress", "Review", "Done"]
const DEFAULT_PROMPT =
  "Build an AI software factory that turns product intent into feature specs, file plans, tickets, and implementation handoffs with agents."

export default function FactoryWorkspace() {
  const [projects, setProjects] = useState<FactoryProject[]>([])
  const [state, setState] = useState<FactoryState | null>(null)
  const [view, setView] = useState<View>("overview")
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [agentInput, setAgentInput] = useState("")
  const [navOpen, setNavOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const activeSpec = state?.specs[0] ?? null

  const progress = useMemo(() => {
    if (!state?.tickets.length) return 0
    return Math.round((state.tickets.filter((ticket) => ticket.status === "Done").length / state.tickets.length) * 100)
  }, [state?.tickets])

  useEffect(() => {
    void loadProjects()
  }, [])

  async function loadProjects() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/factory/projects", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to load workspaces")
      setProjects(json.projects ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces")
    } finally {
      setLoading(false)
    }
  }

  async function openWorkspace(projectId: string) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/factory?projectId=${projectId}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to open workspace")
      setState(json)
      setView("overview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open workspace")
    } finally {
      setLoading(false)
    }
  }

  async function createWorkspace() {
    const name = `Workspace ${projects.length + 1}`
    setError(null)
    setCreatingWorkspace(true)
    try {
      const res = await fetch("/api/factory/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: "Agent-assisted workspace for specs, tickets, files, and delivery.",
        }),
      })
      const project = await res.json()
      if (!res.ok) throw new Error(project.error ?? "Failed to create workspace")
      setProjects((items) => [project, ...items])
      await openWorkspace(project.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace")
    } finally {
      setCreatingWorkspace(false)
    }
  }

  function startRename(project: FactoryProject) {
    setRenamingProjectId(project.id)
    setRenameValue(project.name)
  }

  async function renameWorkspace(projectId: string) {
    const name = renameValue.trim()
    if (!name) return
    setError(null)
    try {
      const res = await fetch(`/api/factory/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const project = await res.json()
      if (!res.ok) throw new Error(project.error ?? "Failed to rename workspace")
      setProjects((items) => items.map((item) => (item.id === projectId ? project : item)))
      if (state?.project.id === projectId) setState({ ...state, project })
      setRenamingProjectId(null)
      setRenameValue("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename workspace")
    }
  }

  async function deleteWorkspace(projectId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/factory/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to delete workspace")
      }
      setProjects((items) => items.filter((item) => item.id !== projectId))
      if (state?.project.id === projectId) setState(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace")
    }
  }

  async function refreshFactory(projectId = state?.project.id) {
    if (!projectId) return
    const res = await fetch(`/api/factory?projectId=${projectId}`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "Failed to refresh factory")
    setState(json)
  }

  async function generateSpec() {
    if (!state || !prompt.trim()) return
    setError(null)
    setWorking("Generating feature spec")
    try {
      const res = await fetch("/api/factory/specs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: state.project.id, prompt }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to generate feature spec")
      await refreshFactory(state.project.id)
      setView("specs")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate feature spec")
    } finally {
      setWorking(null)
    }
  }

  async function generateTickets(specId = activeSpec?.id) {
    if (!state || !specId) {
      setError("Generate a feature spec before creating tickets.")
      return
    }
    setError(null)
    setWorking("Creating tickets")
    try {
      const res = await fetch("/api/factory/tickets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to create tickets")
      await refreshFactory(state.project.id)
      setView("tickets")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tickets")
    } finally {
      setWorking(null)
    }
  }

  async function moveTicket(ticket: FactoryTicket, status: TicketStatus) {
    if (!state) return
    const previous = state
    setState({
      ...state,
      tickets: state.tickets.map((item) => (item.id === ticket.id ? { ...item, status } : item)),
    })
    try {
      const res = await fetch(`/api/factory/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to update ticket")
      await refreshFactory(state.project.id)
    } catch (err) {
      setState(previous)
      setError(err instanceof Error ? err.message : "Failed to update ticket")
    }
  }

  async function sendAgentMessage() {
    if (!state || !agentInput.trim()) return
    const text = agentInput.trim()
    setAgentInput("")
    const optimistic: AgentEvent = {
      id: crypto.randomUUID(),
      project_id: state.project.id,
      actor: "user",
      text,
      created_at: new Date().toISOString(),
    }
    setState({ ...state, events: [optimistic, ...state.events] })
    try {
      const res = await fetch("/api/factory/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: state.project.id, actor: "user", text }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to send message")
      await refreshFactory(state.project.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--geist-background-100)] text-[var(--geist-primary)]">
        <div className="flex items-center gap-2 text-sm text-[var(--geist-gray-800)]">
          <Loader2 size={16} className="animate-spin" />
          Loading factory
        </div>
      </div>
    )
  }

  if (!state) {
    return (
      <WorkspacePicker
        projects={projects}
        error={error}
        creating={creatingWorkspace}
        renamingProjectId={renamingProjectId}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        onOpen={openWorkspace}
        onCreate={createWorkspace}
        onStartRename={startRename}
        onRename={renameWorkspace}
        onCancelRename={() => {
          setRenamingProjectId(null)
          setRenameValue("")
        }}
        onDelete={deleteWorkspace}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--geist-background-100)] text-[var(--geist-primary)]">
      {navOpen && <FactoryNav active={view} onChange={setView} onCollapse={() => setNavOpen(false)} onHome={() => {
        setState(null)
        void loadProjects()
      }} />}
      <main className="flex min-w-0 flex-1 flex-col">
        <FactoryTopbar
          navOpen={navOpen}
          onExpand={() => setNavOpen(true)}
          projectName={state.project.name}
          onHome={() => {
            setState(null)
            void loadProjects()
          }}
        />
        {error && (
          <div className="border-b border-[var(--geist-red-700)] bg-[var(--geist-red-100)] px-4 py-2 text-sm text-[var(--geist-red-700)]">
            {error}
          </div>
        )}
        {working && (
          <div className="border-b border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] px-4 py-2 text-sm text-[var(--geist-gray-800)]">
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              {working}...
            </span>
          </div>
        )}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_340px] max-[1100px]:grid-cols-1">
          <section className="min-h-0 overflow-y-auto">
            {view === "overview" && (
              <Overview
                prompt={prompt}
                setPrompt={setPrompt}
                generateSpec={generateSpec}
                generateTickets={() => generateTickets()}
                spec={activeSpec}
                ticketCount={state.tickets.length}
                specCount={state.specs.length}
                progress={progress}
                working={Boolean(working)}
              />
            )}
            {view === "specs" && <SpecsView specs={state.specs} generateTickets={generateTickets} working={Boolean(working)} />}
            {view === "tickets" && <TicketsView tickets={state.tickets} moveTicket={moveTicket} generateTickets={() => generateTickets()} working={Boolean(working)} />}
            {view === "board" && <BoardView tickets={state.tickets} moveTicket={moveTicket} />}
            {view === "files" && <FilesView blueprints={state.fileBlueprints} />}
          </section>
          <AgentPanel
            events={state.events}
            input={agentInput}
            setInput={setAgentInput}
            send={sendAgentMessage}
            generateSpec={generateSpec}
            generateTickets={() => generateTickets()}
            working={Boolean(working)}
          />
        </div>
      </main>
    </div>
  )
}

function WorkspacePicker({
  projects,
  error,
  creating,
  renamingProjectId,
  renameValue,
  setRenameValue,
  onOpen,
  onCreate,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
}: {
  projects: FactoryProject[]
  error: string | null
  creating: boolean
  renamingProjectId: string | null
  renameValue: string
  setRenameValue: (value: string) => void
  onOpen: (projectId: string) => void
  onCreate: () => void
  onStartRename: (project: FactoryProject) => void
  onRename: (projectId: string) => void
  onCancelRename: () => void
  onDelete: (projectId: string) => void
}) {
  return (
    <div className="min-h-screen bg-[var(--geist-background-100)] text-[var(--geist-primary)]">
      <header className="flex h-14 items-center border-b border-[var(--geist-gray-alpha-200)] px-6">
        <div className="text-lg font-semibold tracking-tight">Pylens</div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold leading-10 tracking-[-1.28px]">Workspaces</h1>
            <p className="mt-2 text-sm text-[var(--geist-gray-800)]">Open a workspace to plan, ticket, and build with agents.</p>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-[var(--geist-radius-sm)] border border-[var(--geist-red-700)] bg-[var(--geist-red-100)] px-3 py-2 text-sm text-[var(--geist-red-700)]">
            {error}
          </div>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={onCreate}
            disabled={creating}
            className="flex min-h-44 flex-col items-center justify-center rounded-[var(--geist-radius-md)] border border-dashed border-[var(--geist-gray-alpha-500)] bg-[var(--geist-background-200)] p-5 text-center transition-colors hover:bg-[var(--geist-gray-alpha-100)] disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)]">
              {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </div>
            <div className="mt-3 text-sm font-semibold">New Workspace</div>
          </button>
          {projects.map((project) => {
            const renaming = renamingProjectId === project.id
            return (
              <div
                key={project.id}
                className="min-h-44 rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-5 transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onOpen(project.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--geist-radius-sm)] bg-[var(--geist-background-100)] text-[var(--geist-blue-700)]"
                    aria-label={`Open ${project.name}`}
                  >
                    <FolderTree size={17} />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onStartRename(project)}
                      className="rounded-[var(--geist-radius-sm)] p-1 text-[var(--geist-gray-700)] hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
                      aria-label={`Rename ${project.name}`}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    <button
                      onClick={() => onOpen(project.id)}
                      className="rounded-[var(--geist-radius-sm)] p-1 text-[var(--geist-gray-700)] hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
                      aria-label={`Open ${project.name}`}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                {renaming ? (
                  <div className="mt-5">
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void onRename(project.id)
                        if (event.key === "Escape") onCancelRename()
                      }}
                      className="h-9 w-full rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] px-2 text-sm font-medium outline-none"
                      autoFocus
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onRename(project.id)}
                        className="h-8 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-3 text-xs font-medium text-[var(--geist-background-100)]"
                      >
                        Save
                      </button>
                      <button
                        onClick={onCancelRename}
                        className="h-8 rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] px-3 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onDelete(project.id)}
                        className="ml-auto h-8 rounded-[var(--geist-radius-sm)] border border-[var(--geist-red-700)] px-3 text-xs font-medium text-[var(--geist-red-700)]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => onOpen(project.id)} className="mt-5 block w-full text-left">
                    <h2 className="truncate text-base font-semibold">{project.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--geist-gray-800)]">
                      {project.description ?? "Agent-assisted workspace"}
                    </p>
                    <div className="mt-4 text-xs text-[var(--geist-gray-700)]">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function FactoryNav({
  active,
  onChange,
  onCollapse,
  onHome,
}: {
  active: View
  onChange: (view: View) => void
  onCollapse: () => void
  onHome: () => void
}) {
  const items = [
    { id: "overview" as const, label: "Build", icon: LayoutDashboard },
    { id: "specs" as const, label: "Feature Specs", icon: FileText },
    { id: "tickets" as const, label: "Tickets", icon: Ticket },
    { id: "board" as const, label: "Board", icon: ClipboardList },
    { id: "files" as const, label: "File System", icon: FolderTree },
  ]

  return (
    <aside className="flex h-screen w-[248px] shrink-0 flex-col border-r border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)]">
      <div className="flex h-14 items-center gap-2 px-3">
        <div className="min-w-0 flex-1">
          <button onClick={onHome} className="truncate text-lg font-semibold tracking-tight hover:opacity-70 transition-opacity">Pylens</button>
        </div>
        <button
          className="rounded-[var(--geist-radius-sm)] p-1.5 text-[var(--geist-gray-800)] hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
          onClick={onCollapse}
          aria-label="Collapse Navigation"
        >
          <PanelLeft size={16} />
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex h-9 items-center gap-2 rounded-[var(--geist-radius-sm)] px-3 text-left text-sm transition-colors ${
                active === item.id
                  ? "bg-[var(--geist-background-100)] text-[var(--geist-primary)] shadow-[var(--geist-shadow-raised)]"
                  : "text-[var(--geist-gray-900)] hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
              }`}
            >
              <Icon size={15} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function FactoryTopbar({
  navOpen,
  onExpand,
  projectName,
  onHome,
}: {
  navOpen: boolean
  onExpand: () => void
  projectName: string
  onHome: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--geist-gray-alpha-200)] px-4">
      {!navOpen && (
        <button onClick={onExpand} className="rounded-[var(--geist-radius-sm)] p-1.5 text-[var(--geist-gray-800)] hover:bg-[var(--geist-gray-alpha-100)]" aria-label="Expand Navigation">
          <PanelLeft size={16} />
        </button>
      )}
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <button
          onClick={onHome}
          className="rounded-[var(--geist-radius-sm)] px-1 font-medium hover:bg-[var(--geist-gray-alpha-100)]"
        >
          Workspace
        </button>
        <ChevronRight size={14} className="text-[var(--geist-gray-700)]" />
        <button
          onClick={onHome}
          className="truncate rounded-[var(--geist-radius-sm)] px-1 text-[var(--geist-gray-800)] hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
        >
          {projectName}
        </button>
      </div>
      <div className="ml-auto hidden h-8 items-center gap-2 rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-200)] px-2 text-xs text-[var(--geist-gray-700)] md:flex">
        <Search size={13} />
        Search soon
      </div>
    </header>
  )
}

function Overview({
  prompt,
  setPrompt,
  generateSpec,
  generateTickets,
  spec,
  ticketCount,
  specCount,
  progress,
  working,
}: {
  prompt: string
  setPrompt: (prompt: string) => void
  generateSpec: () => void
  generateTickets: () => void
  spec: FeatureSpec | null
  ticketCount: number
  specCount: number
  progress: number
  working: boolean
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-6">
      <section className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-5">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--geist-gray-700)]">Product Intake</div>
        <h1 className="mt-4 text-[32px] font-semibold leading-10 tracking-[-1.28px]">Describe the product. The factory creates the work.</h1>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="mt-5 min-h-36 w-full resize-none rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] px-3 py-3 text-sm leading-6 outline-none placeholder:text-[var(--geist-gray-700)]"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={generateSpec}
            disabled={working || !prompt.trim()}
            className="flex h-9 items-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-3 text-sm font-medium text-[var(--geist-background-100)] hover:bg-[var(--geist-gray-900)] disabled:opacity-60"
          >
            <FileText size={15} />
            Generate FS
          </button>
          <button
            onClick={generateTickets}
            disabled={working || !spec}
            className="flex h-9 items-center gap-2 rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] px-3 text-sm font-medium hover:bg-[var(--geist-gray-alpha-100)] disabled:opacity-60"
          >
            <Ticket size={15} />
            Create Tickets
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Metric label="Feature Specs" value={String(specCount)} detail={spec ? spec.title : "None yet"} icon={FileText} />
        <Metric label="Tickets" value={String(ticketCount)} detail="Persisted drafts" icon={Ticket} />
        <Metric label="Done" value={`${progress}%`} detail="Board progress" icon={CheckCircle2} />
      </section>

    </div>
  )
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof FileText }) {
  return (
    <div className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--geist-gray-800)]">{label}</span>
        <Icon size={16} className="text-[var(--geist-gray-700)]" />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-1.28px]">{value}</div>
      <div className="mt-1 truncate text-xs text-[var(--geist-gray-700)]">{detail}</div>
    </div>
  )
}

function SpecsView({ specs, generateTickets, working }: { specs: FeatureSpec[]; generateTickets: (specId: string) => void; working: boolean }) {
  if (!specs.length) return <EmptyState title="No feature specs yet" text="Generate an FS from the Build screen to start." />
  const spec = specs[0]
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-2">
        {specs.map((item) => (
          <div key={item.id} className="rounded-[var(--geist-radius-sm)] px-3 py-2">
            <div className="text-xs font-medium text-[var(--geist-gray-700)]">FS</div>
            <div className="mt-1 truncate text-sm font-medium">{item.title}</div>
          </div>
        ))}
      </aside>
      <section className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-5">
        <div className="flex items-start gap-4">
          <div>
            <div className="text-xs font-medium text-[var(--geist-gray-700)]">Updated {new Date(spec.updated_at).toLocaleString()}</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.96px]">{spec.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--geist-gray-800)]">{spec.summary}</p>
          </div>
          <button
            onClick={() => generateTickets(spec.id)}
            disabled={working}
            className="ml-auto flex h-9 shrink-0 items-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-3 text-sm font-medium text-[var(--geist-background-100)] hover:bg-[var(--geist-gray-900)] disabled:opacity-60"
          >
            <Ticket size={15} />
            Create Tickets
          </button>
        </div>
        <div className="mt-6 grid gap-4">
          {spec.sections.map((section) => (
            <section key={section.title} className="rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-100)] p-4">
              <h2 className="text-sm font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--geist-gray-800)]">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}

function TicketsView({
  tickets,
  moveTicket,
  generateTickets,
  working,
}: {
  tickets: FactoryTicket[]
  moveTicket: (ticket: FactoryTicket, status: TicketStatus) => void
  generateTickets: () => void
  working: boolean
}) {
  if (!tickets.length) {
    return <EmptyState title="No tickets yet" text="Create tickets from a generated FS." action="Create Tickets" onAction={generateTickets} disabled={working} />
  }
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.96px]">Tickets</h1>
        <p className="mt-1 text-sm text-[var(--geist-gray-800)]">Persisted in Neon. Move tickets forward to update the board.</p>
      </div>
      <div className="overflow-hidden rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)]">
        {tickets.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} moveTicket={moveTicket} />
        ))}
      </div>
    </div>
  )
}

function TicketRow({ ticket, moveTicket }: { ticket: FactoryTicket; moveTicket: (ticket: FactoryTicket, status: TicketStatus) => void }) {
  const index = STATUS_ORDER.indexOf(ticket.status)
  const next = STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)]
  return (
    <div className="grid gap-4 border-b border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-4 last:border-b-0 lg:grid-cols-[1fr_150px_126px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-[var(--geist-gray-700)]">{ticket.key}</span>
          <Badge>{ticket.type}</Badge>
          <Badge>{ticket.priority}</Badge>
        </div>
        <h2 className="mt-2 text-sm font-semibold">{ticket.title}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--geist-gray-800)]">{ticket.description}</p>
        <ul className="mt-3 list-inside list-disc text-xs leading-5 text-[var(--geist-gray-700)]">
          {ticket.acceptance.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div>
        <div className="text-xs text-[var(--geist-gray-700)]">Owner</div>
        <div className="mt-1 text-sm font-medium">{ticket.owner}</div>
      </div>
      <div className="flex flex-col items-start gap-2">
        <Badge>{ticket.status}</Badge>
        <button
          onClick={() => moveTicket(ticket, next)}
          disabled={ticket.status === "Done"}
          className="h-8 rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] px-2 text-xs font-medium hover:bg-[var(--geist-gray-alpha-100)] disabled:opacity-60"
        >
          Move Forward
        </button>
      </div>
    </div>
  )
}

function BoardView({ tickets, moveTicket }: { tickets: FactoryTicket[]; moveTicket: (ticket: FactoryTicket, status: TicketStatus) => void }) {
  return (
    <div className="h-full overflow-x-auto px-6 py-6">
      <div className="grid min-w-[980px] grid-cols-5 gap-3">
        {STATUS_ORDER.map((status) => {
          const columnTickets = tickets.filter((ticket) => ticket.status === status)
          return (
            <section key={status} className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)]">
              <div className="flex h-11 items-center justify-between border-b border-[var(--geist-gray-alpha-200)] px-3">
                <h2 className="text-sm font-semibold">{status}</h2>
                <span className="rounded-full bg-[var(--geist-gray-alpha-100)] px-2 py-0.5 text-xs text-[var(--geist-gray-800)]">{columnTickets.length}</span>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {columnTickets.map((ticket) => {
                  const index = STATUS_ORDER.indexOf(ticket.status)
                  const next = STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)]
                  return (
                    <article key={ticket.id} className="rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-100)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-[var(--geist-gray-700)]">{ticket.key}</span>
                        <Badge>{ticket.priority}</Badge>
                      </div>
                      <h3 className="mt-2 text-sm font-medium leading-5">{ticket.title}</h3>
                      <button
                        onClick={() => moveTicket(ticket, next)}
                        disabled={ticket.status === "Done"}
                        className="mt-3 h-7 rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] px-2 text-xs hover:bg-[var(--geist-gray-alpha-100)] disabled:opacity-60"
                      >
                        Move
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function FilesView({ blueprints }: { blueprints: FactoryState["fileBlueprints"] }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)]">
        <div className="flex h-12 items-center gap-2 border-b border-[var(--geist-gray-alpha-200)] px-4">
          <FolderTree size={16} />
          <h1 className="text-sm font-semibold">File System Blueprint</h1>
        </div>
        <div className="divide-y divide-[var(--geist-gray-alpha-200)]">
          {blueprints.map((file) => (
            <div key={file.id} className="grid gap-2 p-4 md:grid-cols-[280px_1fr]">
              <div className="font-mono text-xs text-[var(--geist-blue-700)]">{file.path}</div>
              <div className="text-sm leading-6 text-[var(--geist-gray-800)]">{file.purpose}</div>
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-4">
        <GitBranch size={18} className="text-[var(--geist-blue-700)]" />
        <h2 className="mt-3 text-sm font-semibold">Next</h2>
        <ol className="mt-3 space-y-3 text-sm leading-6 text-[var(--geist-gray-800)]">
          <li>1. Approve file plan.</li>
          <li>2. Assign tickets to agents.</li>
          <li>3. Generate implementation diffs.</li>
          <li>4. Open PRs.</li>
        </ol>
      </aside>
    </div>
  )
}

function AgentPanel({
  events,
  input,
  setInput,
  send,
  generateSpec,
  generateTickets,
  working,
}: {
  events: AgentEvent[]
  input: string
  setInput: (input: string) => void
  send: () => void
  generateSpec: () => void
  generateTickets: () => void
  working: boolean
}) {
  return (
    <aside className="flex min-h-0 flex-col border-l border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] max-[1100px]:hidden">
      <div className="flex h-12 items-center gap-2 border-b border-[var(--geist-gray-alpha-200)] px-4">
        <Bot size={16} className="text-[var(--geist-blue-700)]" />
        <div className="text-sm font-semibold">Agent Log</div>
      </div>
      <div className="grid gap-2 border-b border-[var(--geist-gray-alpha-200)] p-3">
        <button onClick={generateSpec} disabled={working} className="flex h-9 items-center justify-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-3 text-sm font-medium text-[var(--geist-background-100)] disabled:opacity-60">
          <FileText size={15} />
          Generate FS
        </button>
        <button onClick={generateTickets} disabled={working} className="flex h-9 items-center justify-center gap-2 rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] px-3 text-sm font-medium disabled:opacity-60">
          <Ticket size={15} />
          Create Tickets
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {events.map((item) => (
            <div key={item.id} className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-100)] p-3 text-sm leading-6">
              <div className="mb-1 text-xs font-medium text-[var(--geist-gray-700)]">{item.actor === "agent" ? "Agent" : "You"}</div>
              {item.text}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--geist-gray-alpha-200)] p-3">
        <div className="flex gap-2 rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] p-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
            rows={2}
            className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-[var(--geist-gray-700)]"
            placeholder="Add context for agents..."
          />
          <button onClick={send} className="mt-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--geist-primary)] text-[var(--geist-background-100)]" aria-label="Send Agent Message">
            <Send size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function EmptyState({ title, text, action, onAction, disabled }: { title: string; text: string; action?: string; onAction?: () => void; disabled?: boolean }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-5 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--geist-gray-800)]">{text}</p>
        {action && (
          <button onClick={onAction} disabled={disabled} className="mt-4 inline-flex h-9 items-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-3 text-sm font-medium text-[var(--geist-background-100)] disabled:opacity-60">
            <Plus size={15} />
            {action}
          </button>
        )}
      </div>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded-full border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-gray-alpha-100)] px-2 text-xs font-medium text-[var(--geist-gray-800)]">
      {children}
    </span>
  )
}

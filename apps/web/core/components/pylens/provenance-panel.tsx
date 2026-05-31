/**
 * PyLens Provenance Panel
 * Shows code-level provenance for a requirement — which functions implement it,
 * which AI sessions generated them, and which commits landed them.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight, Code2, GitCommit, Bot, FileCode, Loader2 } from "lucide-react";
import useSWR from "swr";

// ── Types ────────────────────────────────────────────────────────────────────

type AIMessage = { role: "user" | "assistant"; content: string };

type ProvenanceTarget =
  | { kind: "function"; functionName: string; filePath: string }
  | { kind: "file"; filePath: string; label?: string }
  | { kind: "files"; filePaths: string[]; label: string };

type ProvenanceRecord = {
  target: ProvenanceTarget;
  requirement: { id: string; title: string; url?: string };
  aiSession?: {
    tool: string;
    date: string;
    messages: AIMessage[];
    keyPoints?: string[];
    constraints?: string[];
    decisions?: string[];
  };
  commit: { sha: string; message: string; author: string; date: string };
};

// ── Mock data keyed by issue sequence id ────────────────────────────────────

const MOCK_PROVENANCE: Record<string, ProvenanceRecord[]> = {
  default: [
    {
      target: { kind: "function", functionName: "authenticateUser", filePath: "src/middleware/auth.ts" },
      requirement: { id: "PROJ-45", title: "JWT authentication flow" },
      aiSession: {
        tool: "Cursor",
        date: "2026-05-10T10:23:00Z",
        messages: [
          { role: "user", content: "I need JWT auth middleware for Express. It should read the token from the Authorization header, verify it, and attach the user to req.user. Return 401 if invalid." },
          { role: "assistant", content: "I'll create a middleware that extracts the Bearer token, verifies it with jsonwebtoken, and attaches the decoded payload. I'll handle token expiry separately from invalid signatures." },
          { role: "user", content: "Also make sure it handles missing headers gracefully." },
          { role: "assistant", content: "Added null checks for missing/malformed Authorization headers. The middleware now returns 401 with distinct error codes: TOKEN_MISSING, TOKEN_EXPIRED, TOKEN_INVALID." },
        ],
        keyPoints: ["Bearer token extraction from Authorization header", "Separate error codes for expiry vs invalid signature", "Graceful handling of missing headers"],
        constraints: ["Must not store tokens server-side", "Stateless verification only"],
        decisions: ["Used jsonwebtoken (RS256)", "Middleware exits early on failure — no next()"],
      },
      commit: { sha: "a3f9b2c", message: "feat: add JWT auth middleware", author: "Rahul Sharma", date: "2026-05-10T11:45:00Z" },
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TOOL_COLORS: Record<string, string> = {
  Cursor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Claude: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "GitHub Copilot": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ChatGPT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function toolBadge(tool: string) {
  return TOOL_COLORS[tool] ?? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
}

function targetIcon(target: ProvenanceTarget) {
  if (target.kind === "function") return <Code2 className="size-3.5 shrink-0 text-blue-400" />;
  if (target.kind === "file") return <FileCode className="size-3.5 shrink-0 text-emerald-400" />;
  return <FileCode className="size-3.5 shrink-0 text-amber-400" />;
}

function targetLabel(target: ProvenanceTarget) {
  if (target.kind === "function") return `${target.functionName}()`;
  if (target.kind === "file") return target.label ?? target.filePath;
  return target.label;
}

function targetSub(target: ProvenanceTarget) {
  if (target.kind === "function") return target.filePath;
  if (target.kind === "file") return target.filePath;
  return target.filePaths.join(", ");
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-custom-border-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-widest text-custom-text-300 hover:bg-custom-background-90 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

// ── Single provenance record ──────────────────────────────────────────────────

function ProvenanceCard({ record }: { record: ProvenanceRecord }) {
  const [convOpen, setConvOpen] = useState(false);

  return (
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-90 overflow-hidden mb-3 last:mb-0">
      {/* Header */}
      <div className="flex items-start gap-2 px-3 py-2.5 border-b border-custom-border-200">
        {targetIcon(record.target)}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-custom-text-100 font-mono truncate">{targetLabel(record.target)}</p>
          <p className="text-xs text-custom-text-400 truncate mt-0.5">{targetSub(record.target)}</p>
        </div>
      </div>

      {/* AI Session */}
      {record.aiSession && (
        <div className="px-3 py-2 border-b border-custom-border-200">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="size-3.5 text-custom-text-300 shrink-0" />
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${toolBadge(record.aiSession.tool)}`}>
              {record.aiSession.tool}
            </span>
            <span className="text-xs text-custom-text-400">{fmtDate(record.aiSession.date)}</span>
          </div>

          {/* First message preview */}
          <p className="text-xs text-custom-text-300 italic leading-relaxed line-clamp-2 mb-2">
            &ldquo;{record.aiSession.messages[0]?.content}&rdquo;
          </p>

          {/* Expand conversation */}
          <button
            onClick={() => setConvOpen(!convOpen)}
            className="text-xs text-custom-primary-100 hover:underline flex items-center gap-1"
          >
            {convOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            {convOpen ? "Hide" : "Show"} conversation ({record.aiSession.messages.length} msgs)
          </button>

          {convOpen && (
            <div className="mt-2 space-y-2">
              {record.aiSession.messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-md px-2.5 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-custom-background-80 border border-custom-border-200"
                      : "bg-amber-500/5 border border-amber-500/15"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-custom-text-400 mb-1">
                    {m.role === "user" ? "👤 You" : `🤖 ${record.aiSession!.tool}`}
                  </p>
                  <p className="text-custom-text-200">{m.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Key points */}
          {record.aiSession.keyPoints && record.aiSession.keyPoints.length > 0 && (
            <div className="mt-2 pt-2 border-t border-custom-border-200">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-custom-text-400 mb-1.5">Key points</p>
              <ul className="space-y-1">
                {record.aiSession.keyPoints.map((kp, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-custom-text-300">
                    <span className="text-amber-500 mt-0.5">·</span>
                    {kp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Commit */}
      <div className="flex items-center gap-2 px-3 py-2">
        <GitCommit className="size-3.5 text-custom-text-300 shrink-0" />
        <code className="text-[11px] bg-custom-background-80 text-custom-text-300 px-1.5 py-0.5 rounded font-mono">
          {record.commit.sha}
        </code>
        <span className="text-xs text-custom-text-400 flex-1 truncate">{record.commit.message}</span>
        <span className="text-xs text-custom-text-400 shrink-0">{timeAgo(record.commit.date)}</span>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyProvenance() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="text-2xl">⬡</div>
      <p className="text-sm text-custom-text-300 max-w-xs leading-relaxed">
        No code has been linked to this requirement yet.
      </p>
      <p className="text-xs text-custom-text-400 max-w-xs leading-relaxed">
        Install the PyLens VS Code extension to automatically track which functions implement this requirement.
      </p>
      <a
        href="https://pylens.org"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-custom-primary-100 hover:underline"
      >
        Get the extension →
      </a>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchProvenance(issueId: string) {
  const res = await fetch(`${API_BASE}/api/pylens/provenance/${issueId}/`, { credentials: "include" });
  if (!res.ok) return { results: [], count: 0 };
  return res.json();
}

export type TPyLensProvenancePanel = {
  issueId: string;
  issueSequenceId?: string;
};

export const PyLensProvenancePanel = observer(function PyLensProvenancePanel({
  issueId,
  issueSequenceId,
}: TPyLensProvenancePanel) {
  const { data, isLoading } = useSWR(
    issueId ? `pylens-provenance-${issueId}` : null,
    () => fetchProvenance(issueId),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="py-6 px-4 flex items-center gap-2 text-custom-text-400 text-sm">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading provenance…</span>
      </div>
    );
  }

  // Fall back to mock data if API returns nothing (for issues without provenance)
  const apiRecords: ProvenanceRecord[] = data?.results ?? [];
  const records = apiRecords.length > 0
    ? apiRecords
    : MOCK_PROVENANCE[issueId] ?? MOCK_PROVENANCE["default"] ?? [];

  const fnRecords = records.filter((r) => r.target.kind === "function");
  const fileRecords = records.filter((r) => r.target.kind === "file");
  const multiRecords = records.filter((r) => r.target.kind === "files");

  return (
    <div className="py-3 px-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-base leading-none">⬡</span>
          <h3 className="text-sm font-semibold text-custom-text-100">Provenance</h3>
        </div>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-custom-background-80 text-custom-text-400">
          {records.length} linked
        </span>
      </div>

      {records.length === 0 ? (
        <EmptyProvenance />
      ) : (
        <div className="space-y-3">
          {fnRecords.length > 0 && (
            <Section title={`Functions (${fnRecords.length})`}>
              {fnRecords.map((r, i) => <ProvenanceCard key={i} record={r} />)}
            </Section>
          )}
          {fileRecords.length > 0 && (
            <Section title={`Files (${fileRecords.length})`}>
              {fileRecords.map((r, i) => <ProvenanceCard key={i} record={r} />)}
            </Section>
          )}
          {multiRecords.length > 0 && (
            <Section title={`Multi-file (${multiRecords.length})`}>
              {multiRecords.map((r, i) => <ProvenanceCard key={i} record={r} />)}
            </Section>
          )}
        </div>
      )}
    </div>
  );
});

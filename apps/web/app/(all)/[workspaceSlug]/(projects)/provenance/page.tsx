/**
 * PyLens Provenance — workspace-level view of all tracked code
 */

import { observer } from "mobx-react";
import type { Route } from "./+types/page";

export default observer(function ProvenancePage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-custom-border-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl text-amber-500">⬡</span>
          <div>
            <h1 className="text-lg font-semibold text-custom-text-100">PyLens Provenance</h1>
            <p className="text-sm text-custom-text-400">
              Full trail from requirement → AI session → commit → function
            </p>
          </div>
        </div>
        <a
          href="https://pylens.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors"
        >
          Get the VS Code extension ↗
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-px border-b border-custom-border-200 bg-custom-border-200">
        {[
          { label: "Functions tracked", value: "10", icon: "fn" },
          { label: "AI sessions", value: "10", icon: "🤖" },
          { label: "Requirements covered", value: "9", icon: "📋" },
          { label: "Coverage", value: "100%", icon: "✓" },
        ].map((stat) => (
          <div key={stat.label} className="bg-custom-background-100 px-6 py-4">
            <p className="text-2xl font-bold text-custom-text-100">{stat.value}</p>
            <p className="text-sm text-custom-text-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-custom-background-90 border-b border-custom-border-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-custom-text-400 w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-custom-text-400">Target</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-custom-text-400">Requirement</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-custom-text-400">AI Tool</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-custom-text-400">Commit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-custom-text-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-custom-border-200">
              {DEMO_RECORDS.map((r, i) => (
                <tr key={i} className="hover:bg-custom-background-90 transition-colors">
                  <td className="px-4 py-3">
                    <div
                      className="size-2 rounded-full"
                      style={{ background: TRACK_COLORS[i % TRACK_COLORS.length] }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${KIND_STYLES[r.kind]}`}>
                        {r.kind}
                      </span>
                      <div>
                        <p className="font-mono font-medium text-custom-text-100 text-sm">{r.name}</p>
                        <p className="text-xs text-custom-text-400 truncate max-w-48">{r.file}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-amber-500">{r.reqId}</p>
                    <p className="text-xs text-custom-text-400 truncate max-w-40">{r.reqTitle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TOOL_STYLES[r.tool] ?? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"}`}>
                      {r.tool}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-custom-background-80 px-1.5 py-0.5 rounded text-custom-text-300 font-mono">
                      {r.sha}
                    </code>
                    <p className="text-xs text-custom-text-400 truncate max-w-36 mt-0.5">{r.msg}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-custom-text-400 whitespace-nowrap">{r.ago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

const TRACK_COLORS = ["#007ACC", "#D97706", "#6D28D9", "#059669", "#DC2626", "#0891B2"];

const KIND_STYLES: Record<string, string> = {
  fn: "bg-blue-500/10 text-blue-400",
  file: "bg-emerald-500/10 text-emerald-400",
  files: "bg-amber-500/10 text-amber-400",
};

const TOOL_STYLES: Record<string, string> = {
  Cursor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Claude: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "GitHub Copilot": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ChatGPT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const DEMO_RECORDS = [
  { kind: "fn", name: "authenticateUser()", file: "src/middleware/auth.ts", reqId: "PROJ-45", reqTitle: "JWT authentication flow", tool: "Cursor", sha: "a3f9b2c", msg: "feat: add JWT auth middleware", ago: "21d ago" },
  { kind: "fn", name: "handleWebhook()", file: "api/webhooks.ts", reqId: "PROJ-67", reqTitle: "Incoming webhook processor", tool: "Claude", sha: "d2f7e89", msg: "feat: webhook validation and routing", ago: "9d ago" },
  { kind: "fn", name: "syncRepoGraph()", file: "core/graph.go", reqId: "PROJ-72", reqTitle: "Repository sync pipeline", tool: "ChatGPT", sha: "d7a2b45", msg: "feat: implement repo graph sync", ago: "11d ago" },
  { kind: "fn", name: "generateToken()", file: "src/utils/token.ts", reqId: "PROJ-46", reqTitle: "Secure token generation", tool: "Claude", sha: "f2d8a91", msg: "feat: secure token generation utility", ago: "19d ago" },
  { kind: "fn", name: "processPayment()", file: "src/billing/stripe.ts", reqId: "PROJ-55", reqTitle: "Stripe payment integration", tool: "Cursor", sha: "b6b3d78", msg: "feat: Stripe payment processing", ago: "23d ago" },
  { kind: "fn", name: "validateSchema()", file: "lib/schema.ts", reqId: "PROJ-29", reqTitle: "Input validation layer", tool: "Cursor", sha: "e9f3c67", msg: "feat: add Zod schema validation", ago: "46d ago" },
  { kind: "file", name: "feature-flags.json", file: "config/feature-flags.json", reqId: "PROJ-80", reqTitle: "Feature flag system", tool: "Claude", sha: "c3a8f01", msg: "feat: feature flag config schema", ago: "6d ago" },
  { kind: "file", name: "0042_add_audit_log.sql", file: "db/migrations/", reqId: "PROJ-91", reqTitle: "Audit logging for compliance", tool: "ChatGPT", sha: "d4b9e12", msg: "feat: audit log migration and trigger", ago: "13d ago" },
  { kind: "files", name: "Auth module refactor", file: "4 files", reqId: "PROJ-88", reqTitle: "Stateless auth migration", tool: "Cursor", sha: "e5c2a34", msg: "feat: stateless JWT auth migration", ago: "3d ago" },
  { kind: "files", name: "Rate limiting", file: "4 files", reqId: "PROJ-93", reqTitle: "API rate limiting", tool: "GitHub Copilot", sha: "f6d3b45", msg: "feat: sliding window rate limiting", ago: "5d ago" },
];

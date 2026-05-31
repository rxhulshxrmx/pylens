const USER_ID = "usr-rahul-001";
const WS_ID = "ws-pylens-001";
const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

const mkIssue = (o) => ({
  id: o.id,
  sequence_id: o.seq,
  name: o.name,
  sort_order: o.sort,
  state_id: o.state,
  priority: o.priority,
  label_ids: o.labels ?? [],
  assignee_ids: o.assignees ?? [USER_ID],
  estimate_point: null,
  sub_issues_count: 0,
  attachment_count: 0,
  link_count: 0,
  project_id: o.project,
  parent_id: null,
  cycle_id: null,
  module_ids: [],
  type_id: null,
  created_at: d(o.created ?? 30),
  updated_at: d(o.updated ?? 10),
  start_date: null,
  target_date: o.due ?? null,
  completed_at: o.completed ?? null,
  archived_at: null,
  created_by: USER_ID,
  updated_by: USER_ID,
  description_html: o.desc ?? "<p></p>",
  is_subscribed: false,
});

const P1 = "proj-001";
const P2 = "proj-002";

const ISSUES_P1 = [
  mkIssue({ id:"iss-001", seq:45, name:"JWT authentication flow", project:P1, state:"state-done-001", priority:"urgent", labels:["lbl-001","lbl-002","lbl-004"], sort:10000, created:30, updated:21, completed:d(21), desc:"<p>Implement JWT middleware for Express. Read token from Authorization header, verify it, attach decoded user to req.user. Return 401 with distinct error codes: TOKEN_MISSING, TOKEN_EXPIRED, TOKEN_INVALID.</p>" }),
  mkIssue({ id:"iss-002", seq:46, name:"Secure token generation", project:P1, state:"state-done-001", priority:"urgent", labels:["lbl-002","lbl-004"], sort:20000, created:28, updated:19, completed:d(19), desc:"<p>crypto.randomBytes(32), base64url encoding, type prefix (pk_live_ / pk_test_), CRC32 checksum for corruption detection.</p>" }),
  mkIssue({ id:"iss-003", seq:61, name:"Background job processing", project:P1, state:"state-done-001", priority:"high", labels:["lbl-001"], sort:30000, created:25, updated:16, completed:d(16), desc:"<p>Redis BLPOP job queue parser with per-job-type retry config (YAML), dead-letter queue, exponential backoff, structured logging via structlog.</p>" }),
  mkIssue({ id:"iss-004", seq:29, name:"Input validation layer (Zod)", project:P1, state:"state-done-001", priority:"high", labels:["lbl-001"], sort:40000, created:50, updated:46, completed:d(46), desc:"<p>Zod-based schema validation. Returns typed Result&lt;T, ValidationError[]&gt;, never throws. Human-readable error message map.</p>" }),
  mkIssue({ id:"iss-005", seq:55, name:"Stripe payment integration", project:P1, state:"state-prog-001", priority:"urgent", labels:["lbl-001"], sort:50000, created:22, updated:1, due:d(-3), desc:"<p>Stripe PaymentIntent with idempotency keys (SHA256 orderId:amount:currency), async reconciliation, needs_review state for mismatches.</p>" }),
  mkIssue({ id:"iss-006", seq:67, name:"Incoming webhook processor", project:P1, state:"state-done-001", priority:"medium", labels:["lbl-001","lbl-004"], sort:60000, created:15, updated:9, completed:d(9), desc:"<p>HMAC-SHA256 (timingSafeEqual), event type registry, timestamp + Redis replay attack protection. Fail-open for unknown events.</p>" }),
  mkIssue({ id:"iss-007", seq:72, name:"Repository sync pipeline", project:P1, state:"state-done-001", priority:"medium", labels:["lbl-001","lbl-003"], sort:70000, created:18, updated:11, completed:d(11), desc:"<p>Incremental git commit graph sync to SQLite via go-git. Batched transactions, checkpoint SHA, resumable after crash.</p>" }),
  mkIssue({ id:"iss-008", seq:80, name:"Feature flag system", project:P1, state:"state-done-001", priority:"medium", labels:["lbl-001"], sort:80000, created:12, updated:6, completed:d(6), desc:"<p>JSON schema for flags: boolean, percentage rollout (consistent hashing), user-list. Per-environment overrides. Master kill switch.</p>" }),
  mkIssue({ id:"iss-009", seq:88, name:"Stateless auth migration (sessions → JWT)", project:P1, state:"state-prog-001", priority:"urgent", labels:["lbl-001","lbl-002"], sort:90000, created:8, updated:3, due:d(-1), desc:"<p>Four-file coordinated change. Dual-mode rollout: JWT-first with 30-day session fallback. auth.json dual_mode flag for ops control.</p>" }),
  mkIssue({ id:"iss-010", seq:91, name:"Audit logging for compliance", project:P1, state:"state-todo-001", priority:"high", labels:["lbl-001","lbl-004"], sort:100000, created:10, updated:10, due:d(-7), desc:"<p>PostgreSQL audit_log table with JSONB old/new snapshots, inet IP, auto-trigger, CREATE INDEX CONCURRENTLY (zero-downtime on 50M rows).</p>" }),
  mkIssue({ id:"iss-011", seq:93, name:"API rate limiting", project:P1, state:"state-done-001", priority:"high", labels:["lbl-001"], sort:110000, created:6, updated:5, completed:d(5), desc:"<p>Sliding window rate limiter in Redis. Per-route config in rate-limits.json. 429 + Retry-After header. Fail-open by default.</p>" }),
  mkIssue({ id:"iss-012", seq:101, name:"Real-time collaboration WebSocket", project:P1, state:"state-backlog-001", priority:"medium", labels:["lbl-001"], sort:120000, created:3, updated:3, assignees:[], desc:"<p>WebSocket server for real-time collaboration. CRDT-based conflict resolution.</p>" }),
];

const ISSUES_P2 = [
  mkIssue({ id:"iss-101", seq:1, name:"VS Code extension — inline provenance", project:P2, state:"state-done-002", priority:"urgent", labels:["lbl-007"], sort:10000, created:20, updated:2, completed:d(2), desc:"<p>Ghost text annotation (GitLens-style), hover dialog with AI conversation, gutter icons, status bar coverage badge, bottom panel with timeline + AI sessions. All languages.</p>" }),
  mkIssue({ id:"iss-102", seq:2, name:"Provenance web dashboard", project:P2, state:"state-prog-002", priority:"urgent", labels:["lbl-005","lbl-006","lbl-007"], sort:20000, created:10, updated:1, due:d(-2), desc:"<p>Requirements table, provenance timeline, AI session browser, detail drawer with full conversation thread. Plane.so UI with PyLens provenance panel in sidebar.</p>" }),
  mkIssue({ id:"iss-103", seq:3, name:"Gutter icons + coverage badge", project:P2, state:"state-done-002", priority:"high", labels:["lbl-007"], sort:30000, created:8, updated:3, completed:d(3), desc:"<p>Amber ⬡ gutter dots on tracked functions. Status bar shows ⬡ N/M tracked for current file. Updates on cursor move.</p>" }),
  mkIssue({ id:"iss-104", seq:4, name:"Multi-target provenance (fn/file/files)", project:P2, state:"state-done-002", priority:"medium", labels:["lbl-007"], sort:40000, created:5, updated:1, completed:d(1), desc:"<p>ProvenanceTarget union: function, file (configs, SQL migrations), files (multi-file features). Kind badges throughout UI.</p>" }),
  mkIssue({ id:"iss-105", seq:5, name:"Hover dialog with AI conversation", project:P2, state:"state-done-002", priority:"high", labels:["lbl-005","lbl-007"], sort:50000, created:12, updated:4, completed:d(4), desc:"<p>VS Code HoverProvider scoped to active file. Shows requirement, AI prompt preview, key points, decisions, constraints.</p>" }),
];

function issueResponse(issues) {
  return {
    grouped_by: null,
    next_cursor: "0:0:0",
    prev_cursor: "0:0:0",
    next_page_results: false,
    prev_page_results: false,
    total_count: issues.length,
    count: issues.length,
    total_pages: 1,
    extra_stats: null,
    results: issues,
    total_results: issues.length,
  };
}

module.exports = { ISSUES_P1, ISSUES_P2, issueResponse };

export type TargetKind = 'function' | 'file' | 'files';

export type AIMessage = { role: 'user' | 'assistant'; content: string };

export type Requirement = { id: string; title: string; status: 'backlog' | 'todo' | 'in_progress' | 'done'; priority: 'urgent' | 'high' | 'medium' | 'low'; url?: string };

export type AISession = {
  tool: string; date: string;
  messages: AIMessage[];
  keyPoints?: string[]; constraints?: string[]; decisions?: string[];
};

export type Commit = { sha: string; message: string; author: string; date: string };

export type ProvenanceRecord = {
  id: string;
  target: { kind: 'function'; functionName: string; filePath: string } | { kind: 'file'; filePath: string; label?: string } | { kind: 'files'; filePaths: string[]; label: string };
  requirementId: string;
  aiSession?: AISession;
  commit: Commit;
};

export const REQUIREMENTS: Requirement[] = [
  { id: 'PROJ-45', title: 'JWT authentication flow', status: 'done', priority: 'urgent' },
  { id: 'PROJ-61', title: 'Background job processing', status: 'done', priority: 'high' },
  { id: 'PROJ-33', title: 'Analytics dashboard view', status: 'in_progress', priority: 'high' },
  { id: 'PROJ-72', title: 'Repository sync pipeline', status: 'done', priority: 'medium' },
  { id: 'PROJ-29', title: 'Input validation layer', status: 'done', priority: 'high' },
  { id: 'PROJ-46', title: 'Secure token generation', status: 'done', priority: 'urgent' },
  { id: 'PROJ-18', title: 'User profile API endpoint', status: 'done', priority: 'medium' },
  { id: 'PROJ-55', title: 'Stripe payment integration', status: 'in_progress', priority: 'urgent' },
  { id: 'PROJ-80', title: 'Feature flag system', status: 'done', priority: 'medium' },
  { id: 'PROJ-91', title: 'Audit logging for compliance', status: 'todo', priority: 'high' },
  { id: 'PROJ-88', title: 'Stateless auth migration (sessions → JWT)', status: 'in_progress', priority: 'urgent' },
  { id: 'PROJ-93', title: 'API rate limiting', status: 'done', priority: 'high' },
  { id: 'PROJ-67', title: 'Incoming webhook processor', status: 'done', priority: 'medium' },
  { id: 'PROJ-12', title: 'Database connection pooling', status: 'done', priority: 'low' },
  { id: 'PROJ-101', title: 'Real-time collaboration WebSocket', status: 'backlog', priority: 'medium' },
  { id: 'PROJ-102', title: 'Email notification system', status: 'backlog', priority: 'low' },
];

export const PROVENANCE: ProvenanceRecord[] = [
  {
    id: 'p1',
    target: { kind: 'function', functionName: 'authenticateUser', filePath: 'src/middleware/auth.ts' },
    requirementId: 'PROJ-45',
    aiSession: {
      tool: 'Cursor', date: '2026-05-10T10:23:00Z',
      messages: [
        { role: 'user', content: 'I need JWT auth middleware for Express. It should read the token from the Authorization header, verify it, and attach the user to req.user. Return 401 if invalid.' },
        { role: 'assistant', content: 'I\'ll create a middleware that extracts the Bearer token, verifies it with jsonwebtoken, and attaches the decoded payload. I\'ll handle token expiry separately from invalid signatures so you can show the right error message.' },
        { role: 'user', content: 'Good, but also make sure it handles missing headers gracefully — don\'t crash, just return 401.' },
        { role: 'assistant', content: 'Added null checks for missing or malformed Authorization headers. The middleware now returns 401 with a descriptive message for: missing header, wrong format, expired token, and invalid signature — each as a distinct error code.' },
      ],
      keyPoints: ['Bearer token extraction from Authorization header', 'Separate error codes for expiry vs invalid signature', 'Graceful handling of missing/malformed headers', 'Decoded payload attached to req.user'],
      constraints: ['Must not store tokens server-side', 'Stateless verification only', 'Return 401, never 403, for auth failures'],
      decisions: ['Used jsonwebtoken library (RS256)', 'Error codes: TOKEN_MISSING, TOKEN_EXPIRED, TOKEN_INVALID', 'Middleware exits early — no next() on failure'],
    },
    commit: { sha: 'a3f9b2c', message: 'feat: add JWT auth middleware', author: 'Rahul Sharma', date: '2026-05-10T11:45:00Z' },
  },
  {
    id: 'p2',
    target: { kind: 'function', functionName: 'parseJobQueue', filePath: 'workers/queue.py' },
    requirementId: 'PROJ-61',
    aiSession: {
      tool: 'Claude', date: '2026-05-15T14:30:00Z',
      messages: [
        { role: 'user', content: 'Write a job queue parser in Python that reads tasks from Redis and dispatches them to worker threads. I need retry logic too.' },
        { role: 'assistant', content: 'I\'ll build a parser that uses BLPOP for blocking reads from Redis, deserializes JSON job payloads, and dispatches to a thread pool. For retries I\'ll use exponential backoff with a max of 3 attempts, then move failed jobs to a dead-letter queue.' },
        { role: 'user', content: 'Can the retry count be configurable per job type?' },
        { role: 'assistant', content: 'Yes — I\'ll add a job_type registry where each type specifies max_retries and backoff_factor. Jobs that don\'t match a registered type fall back to the global defaults. The registry is loaded from a YAML config file at startup.' },
        { role: 'user', content: 'Also add structured logging so I can trace individual job lifecycles.' },
        { role: 'assistant', content: 'Added structlog with bound context per job: job_id, job_type, attempt_number, and worker_id. Every state transition (queued, dispatched, completed, failed, retrying) emits a log event with timing metadata.' },
      ],
      keyPoints: ['Blocking BLPOP reads from Redis', 'Thread pool dispatch', 'Per-job-type retry config from YAML', 'Dead-letter queue after max retries', 'Structured logging with job lifecycle events'],
      constraints: ['Must not lose jobs on worker crash', 'Max 3 retries by default', 'Dead-letter queue must be inspectable'],
      decisions: ['Used structlog for JSON-structured logs', 'YAML config for job type registry', 'Exponential backoff: 2^attempt seconds'],
    },
    commit: { sha: 'b8c4d12', message: 'feat: implement job queue worker', author: 'Rahul Sharma', date: '2026-05-15T16:00:00Z' },
  },
  {
    id: 'p3',
    target: { kind: 'function', functionName: 'validateSchema', filePath: 'lib/schema.ts' },
    requirementId: 'PROJ-29',
    aiSession: {
      tool: 'Cursor', date: '2026-04-15T10:00:00Z',
      messages: [
        { role: 'user', content: 'Build a schema validation utility using Zod. It should validate API request bodies and return structured error messages, not throw.' },
        { role: 'assistant', content: 'I\'ll create a validateSchema wrapper around Zod\'s safeParse that normalises errors into a { field, message, code } array, never throws, and returns a typed Result<T, ValidationError[]>.' },
        { role: 'user', content: 'The error messages need to be human-readable, not Zod\'s internal codes.' },
        { role: 'assistant', content: 'Added a message map that converts Zod error codes to plain English. Custom messages per field are supported via the schema definition.' },
      ],
      keyPoints: ['Zod safeParse — never throws', 'Typed Result<T, ValidationError[]> return', 'Human-readable error message map', 'Custom messages supported per field'],
      constraints: ['Must not throw — always return Result', 'Error format must match API spec exactly'],
      decisions: ['Result type over exception handling', 'Flat error array for API consumers'],
    },
    commit: { sha: 'e9f3c67', message: 'feat: add Zod schema validation', author: 'Rahul Sharma', date: '2026-04-15T12:00:00Z' },
  },
  {
    id: 'p4',
    target: { kind: 'function', functionName: 'generateToken', filePath: 'src/utils/token.ts' },
    requirementId: 'PROJ-46',
    aiSession: {
      tool: 'Claude', date: '2026-05-12T11:00:00Z',
      messages: [
        { role: 'user', content: 'Implement a secure token generator for API keys. Needs to be cryptographically random, URL-safe, and have a prefix to identify the token type.' },
        { role: 'assistant', content: 'I\'ll use crypto.randomBytes(32) for 256 bits of entropy, encode as base64url for URL safety, and prepend a type prefix like \'pk_live_\'.' },
        { role: 'user', content: 'Can we add a checksum so we can detect accidentally corrupted tokens?' },
        { role: 'assistant', content: 'Added a 4-byte CRC32 checksum appended to the token before encoding. validateToken() decodes, strips the checksum, recomputes it, and returns false if it doesn\'t match.' },
      ],
      keyPoints: ['crypto.randomBytes(32) for 256-bit entropy', 'base64url encoding for URL safety', 'Type prefix (pk_live_, pk_test_)', 'CRC32 checksum for corruption detection'],
      constraints: ['Must use crypto, not Math.random', 'Must be URL-safe without encoding'],
      decisions: ['CRC32 over full HMAC for lightweight validation', 'Prefix is part of the token, not stripped on validation'],
    },
    commit: { sha: 'f2d8a91', message: 'feat: secure token generation utility', author: 'Rahul Sharma', date: '2026-05-12T13:30:00Z' },
  },
  {
    id: 'p5',
    target: { kind: 'function', functionName: 'processPayment', filePath: 'src/billing/stripe.ts' },
    requirementId: 'PROJ-55',
    aiSession: {
      tool: 'Cursor', date: '2026-05-08T14:00:00Z',
      messages: [
        { role: 'user', content: 'Integrate Stripe payment processing. Must handle idempotency to prevent double charges.' },
        { role: 'assistant', content: 'I\'ll use Stripe\'s idempotency keys derived from a hash of the order ID + amount. Each call passes this key to Stripe, which deduplicates retries automatically.' },
        { role: 'user', content: 'What about partial failures — what if we record success but Stripe actually failed?' },
        { role: 'assistant', content: 'Added a reconciliation step: after every payment, we query Stripe\'s PaymentIntent status and compare it to our local record. Mismatches trigger an alert and mark the payment as \'needs_review\'.' },
      ],
      keyPoints: ['Idempotency keys from hash(orderId + amount)', 'Local PaymentIntent ID caching', 'Post-payment status reconciliation'],
      constraints: ['Zero double-charges, ever', 'Must handle Stripe API timeouts gracefully'],
      decisions: ['Idempotency key = SHA256(orderId:amount:currency)', 'Reconciliation is async — never blocks checkout'],
    },
    commit: { sha: 'b6b3d78', message: 'feat: Stripe payment processing', author: 'Rahul Sharma', date: '2026-05-08T16:00:00Z' },
  },
  {
    id: 'p6',
    target: { kind: 'function', functionName: 'handleWebhook', filePath: 'api/webhooks.ts' },
    requirementId: 'PROJ-67',
    aiSession: {
      tool: 'Claude', date: '2026-05-22T09:30:00Z',
      messages: [
        { role: 'user', content: 'Build a webhook handler that validates HMAC signatures and routes events to the right processor.' },
        { role: 'assistant', content: 'I\'ll use crypto.timingSafeEqual to compare the HMAC-SHA256 signature. After validation, events are dispatched to a processor registry keyed by event type.' },
        { role: 'user', content: 'We need replay attack protection too.' },
        { role: 'assistant', content: 'Added a timestamp check: webhooks older than 5 minutes are rejected. Redis stores signatures with a 10-minute TTL to catch duplicates.' },
      ],
      keyPoints: ['HMAC-SHA256 with timingSafeEqual', 'Event type registry for routing', 'Timestamp + Redis replay protection'],
      constraints: ['Must use timing-safe comparison', 'Unknown event types must not error'],
      decisions: ['Redis replay protection is optional/degrades gracefully', 'Acknowledge unknown events — never reject them'],
    },
    commit: { sha: 'd2f7e89', message: 'feat: webhook validation and routing', author: 'Rahul Sharma', date: '2026-05-22T11:45:00Z' },
  },
  {
    id: 'p7',
    target: { kind: 'file', filePath: 'config/feature-flags.json', label: 'Feature flags config' },
    requirementId: 'PROJ-80',
    aiSession: {
      tool: 'Claude', date: '2026-05-25T10:00:00Z',
      messages: [
        { role: 'user', content: 'Design the JSON schema for our feature flag config. Flags need to support boolean toggles, percentage rollouts, and per-user overrides.' },
        { role: 'assistant', content: 'Here\'s a schema with three flag types: simple boolean, percentage (0-100 with a seed for consistent hashing), and user list. Each flag has an \'enabled\' master switch.' },
        { role: 'user', content: 'Add an \'environments\' field so flags can differ between staging and prod.' },
        { role: 'assistant', content: 'Added an environments map. Each environment inherits the top-level defaults and can override any field. If an environment key is missing, it falls back to the top-level value.' },
      ],
      keyPoints: ['Three flag types: boolean, percentage, user-list', 'Master \'enabled\' kill switch on every flag', 'Per-environment overrides with fallback'],
      constraints: ['Schema must be human-editable without tooling', 'Must support zero-downtime flag changes'],
      decisions: ['JSON over YAML for strict typing', 'Percentage uses consistent hashing on user ID — no DB needed'],
    },
    commit: { sha: 'c3a8f01', message: 'feat: feature flag config schema', author: 'Rahul Sharma', date: '2026-05-25T12:00:00Z' },
  },
  {
    id: 'p8',
    target: { kind: 'file', filePath: 'db/migrations/0042_add_audit_log.sql', label: 'Audit log migration' },
    requirementId: 'PROJ-91',
    aiSession: {
      tool: 'ChatGPT', date: '2026-05-18T14:00:00Z',
      messages: [
        { role: 'user', content: 'Write a SQL migration to add an audit_log table. It needs to record who changed what, when, and from which IP. Must work on Postgres.' },
        { role: 'assistant', content: 'I\'ll create an audit_log table with: id (uuid), table_name, record_id, action (INSERT/UPDATE/DELETE), old_data (jsonb), new_data (jsonb), user_id, ip_address (inet), and created_at.' },
        { role: 'user', content: 'The migration needs to be safe to run on a live table with 50M rows.' },
        { role: 'assistant', content: 'Using CREATE TABLE IF NOT EXISTS and CREATE INDEX CONCURRENTLY so it won\'t lock. The trigger is added last after indexes are built.' },
      ],
      keyPoints: ['audit_log table with jsonb old/new data snapshots', 'inet type for IP addresses', 'Trigger auto-populates on watched tables', 'CREATE INDEX CONCURRENTLY — no table lock'],
      constraints: ['Must be safe on 50M-row live table', 'Must include rollback section', 'Postgres only'],
      decisions: ['jsonb over separate columns for flexibility', 'CONCURRENTLY index to avoid downtime'],
    },
    commit: { sha: 'd4b9e12', message: 'feat: audit log migration and trigger', author: 'Rahul Sharma', date: '2026-05-18T16:30:00Z' },
  },
  {
    id: 'p9',
    target: { kind: 'files', filePaths: ['src/middleware/auth.ts', 'src/utils/token.ts', 'src/models/session.ts', 'config/auth.json'], label: 'Auth module refactor' },
    requirementId: 'PROJ-88',
    aiSession: {
      tool: 'Cursor', date: '2026-05-28T09:00:00Z',
      messages: [
        { role: 'user', content: 'We need to migrate our entire auth system from server-side sessions to stateless JWT. This touches the middleware, token util, session model, and auth config.' },
        { role: 'assistant', content: 'I\'ll plan this as four coordinated changes: 1) Update auth middleware to verify JWTs instead of looking up sessions. 2) Rewrite token util to sign JWTs. 3) Deprecate the session model. 4) Update auth.json with JWT config.' },
        { role: 'user', content: 'How do we handle users who are currently logged in with sessions during the rollout?' },
        { role: 'assistant', content: 'Add a dual-mode period: the middleware checks for a JWT first, falls back to session lookup if not found. The auth.json \'dual_mode\' flag controls this. After 30 days, flip the flag.' },
      ],
      keyPoints: ['Four-file coordinated change', 'Dual-mode rollout: JWT-first, session fallback', '30-day migration window via config flag'],
      constraints: ['Zero logout of existing users during rollout', 'Must be reversible within the 30-day window'],
      decisions: ['Dual-mode over big-bang cutover', 'Config flag over code flag for ops control'],
    },
    commit: { sha: 'e5c2a34', message: 'feat: stateless JWT auth migration (dual-mode)', author: 'Rahul Sharma', date: '2026-05-28T15:00:00Z' },
  },
  {
    id: 'p10',
    target: { kind: 'function', functionName: 'syncRepoGraph', filePath: 'core/graph.go' },
    requirementId: 'PROJ-72',
    aiSession: {
      tool: 'ChatGPT', date: '2026-05-20T13:00:00Z',
      messages: [
        { role: 'user', content: 'Write a Go function that syncs a local git repo\'s commit graph to SQLite. It should handle incremental updates, not full re-syncs.' },
        { role: 'assistant', content: 'I\'ll use go-git to walk commits from HEAD, store the latest synced SHA in SQLite, and only process commits newer than that checkpoint.' },
        { role: 'user', content: 'What happens if the sync is interrupted mid-way?' },
        { role: 'assistant', content: 'I\'ll wrap each batch in a SQLite transaction. If interrupted, the transaction rolls back and the checkpoint SHA isn\'t updated, so the next sync re-processes from the last clean state.' },
      ],
      keyPoints: ['Incremental sync from last checkpoint SHA', 'go-git for commit traversal', 'Batched SQLite transactions', 'Graph edges from tree diffs'],
      constraints: ['Must not duplicate commits on re-run', 'Sync must be resumable after crash'],
      decisions: ['Checkpoint stored in sqlite_meta table', 'Batch size: 50 commits per transaction'],
    },
    commit: { sha: 'd7a2b45', message: 'feat: implement repo graph sync', author: 'Rahul Sharma', date: '2026-05-20T15:20:00Z' },
  },
];

export const TOOL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Cursor':         { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   dot: '#007ACC' },
  'Claude':         { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700',  dot: '#D97A14' },
  'GitHub Copilot': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: '#6D28D9' },
  'ChatGPT':        { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: '#059669' },
};

export const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-600',
  todo: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  done: 'bg-emerald-50 text-emerald-700',
};

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-600',
  high: 'text-amber-600',
  medium: 'text-blue-600',
  low: 'text-gray-400',
};

export function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

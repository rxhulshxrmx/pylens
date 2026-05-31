module.exports = {
  "iss-001": [{
    target: { kind: "function", functionName: "authenticateUser", filePath: "src/middleware/auth.ts" },
    aiSession: {
      tool: "Cursor", date: "2026-05-10T10:23:00Z",
      messages: [
        { role: "user", content: "I need JWT auth middleware for Express. Read token from Authorization header, verify it, attach user to req.user, return 401 if invalid." },
        { role: "assistant", content: "Creating middleware that extracts the Bearer token, verifies with jsonwebtoken, attaches decoded payload. Token expiry handled separately from invalid signatures for distinct error codes." },
        { role: "user", content: "Also handle missing headers gracefully — do not crash, just return 401." },
        { role: "assistant", content: "Added null checks for missing/malformed Authorization headers. Returns 401 with codes: TOKEN_MISSING, TOKEN_EXPIRED, TOKEN_INVALID." },
      ],
      keyPoints: ["Bearer token extraction from Authorization header", "Separate error codes for expiry vs invalid signature", "Graceful handling of missing/malformed headers", "Decoded payload attached to req.user"],
      constraints: ["Must not store tokens server-side", "Stateless verification only", "Return 401, never 403, for auth failures"],
      decisions: ["Used jsonwebtoken library (RS256)", "Error codes: TOKEN_MISSING, TOKEN_EXPIRED, TOKEN_INVALID", "Middleware exits early — no next() on failure"],
    },
    commit: { sha: "a3f9b2c", message: "feat: add JWT auth middleware", author: "Rahul Sharma", date: "2026-05-10T11:45:00Z" },
  }],
  "iss-002": [{
    target: { kind: "function", functionName: "generateToken", filePath: "src/utils/token.ts" },
    aiSession: {
      tool: "Claude", date: "2026-05-12T11:00:00Z",
      messages: [
        { role: "user", content: "Implement a secure token generator for API keys. Needs to be cryptographically random, URL-safe, and have a prefix to identify the token type." },
        { role: "assistant", content: "Using crypto.randomBytes(32) for 256 bits of entropy, base64url encoding for URL safety, and prepending a type prefix like pk_live_ or pk_test_." },
        { role: "user", content: "Can we add a checksum so we can detect accidentally corrupted tokens?" },
        { role: "assistant", content: "Added a 4-byte CRC32 checksum appended to the token before encoding. validateToken() decodes, strips the checksum, recomputes it, and returns false if it does not match." },
      ],
      keyPoints: ["crypto.randomBytes(32) for 256-bit entropy", "base64url encoding for URL safety", "Type prefix (pk_live_, pk_test_)", "CRC32 checksum for corruption detection"],
      constraints: ["Must use crypto, not Math.random", "Must be URL-safe without encoding"],
      decisions: ["CRC32 over full HMAC for lightweight validation", "Prefix is part of the token, not stripped on validation"],
    },
    commit: { sha: "f2d8a91", message: "feat: secure token generation utility", author: "Rahul Sharma", date: "2026-05-12T13:30:00Z" },
  }],
  "iss-005": [{
    target: { kind: "function", functionName: "processPayment", filePath: "src/billing/stripe.ts" },
    aiSession: {
      tool: "Cursor", date: "2026-05-08T14:00:00Z",
      messages: [
        { role: "user", content: "Integrate Stripe payment processing. Must handle idempotency to prevent double charges." },
        { role: "assistant", content: "Using Stripe idempotency keys derived from SHA256(orderId:amount:currency). Stripe deduplicates retries automatically. Local PaymentIntent ID stored to detect cached results." },
        { role: "user", content: "What if we record success but Stripe actually failed?" },
        { role: "assistant", content: "Added async reconciliation: after every payment, query Stripe PaymentIntent status and compare to local record. Mismatches trigger alert and set payment to needs_review." },
      ],
      keyPoints: ["Idempotency keys from hash(orderId + amount)", "Local PaymentIntent ID caching", "Post-payment status reconciliation", "Nightly review job for mismatches"],
      constraints: ["Zero double-charges, ever", "Must handle Stripe API timeouts gracefully"],
      decisions: ["Idempotency key = SHA256(orderId:amount:currency)", "Reconciliation is async — never blocks checkout"],
    },
    commit: { sha: "b6b3d78", message: "feat: Stripe payment processing", author: "Rahul Sharma", date: "2026-05-08T16:00:00Z" },
  }],
  "iss-009": [{
    target: { kind: "files", filePaths: ["src/middleware/auth.ts", "src/utils/token.ts", "src/models/session.ts", "config/auth.json"], label: "Auth module refactor" },
    aiSession: {
      tool: "Cursor", date: "2026-05-28T09:00:00Z",
      messages: [
        { role: "user", content: "We need to migrate our entire auth system from server-side sessions to stateless JWT. This touches the middleware, token util, session model, and auth config." },
        { role: "assistant", content: "Planning four coordinated changes: update auth middleware to verify JWTs, rewrite token util, deprecate session model, update auth.json with JWT config. Using dual-mode period: JWT-first, session fallback." },
        { role: "user", content: "How do we handle users who are currently logged in with sessions during the rollout?" },
        { role: "assistant", content: "auth.json dual_mode flag controls the fallback. JWT checked first, session lookup if not found. After 30 days, flip the flag and session fallback becomes dead code." },
      ],
      keyPoints: ["Four-file coordinated change", "Dual-mode rollout: JWT-first, session fallback", "30-day migration window via config flag"],
      constraints: ["Zero logout of existing users during rollout", "Must be reversible within the 30-day window"],
      decisions: ["Dual-mode over big-bang cutover", "Config flag over code flag for ops control"],
    },
    commit: { sha: "e5c2a34", message: "feat: stateless JWT auth migration (dual-mode)", author: "Rahul Sharma", date: "2026-05-28T15:00:00Z" },
  }],
  "iss-010": [{
    target: { kind: "file", filePath: "db/migrations/0042_add_audit_log.sql", label: "Audit log migration" },
    aiSession: {
      tool: "ChatGPT", date: "2026-05-18T14:00:00Z",
      messages: [
        { role: "user", content: "Write a SQL migration to add an audit_log table for Postgres. Record who changed what, when, and from which IP." },
        { role: "assistant", content: "Creating audit_log with: id (uuid), table_name, record_id, action (INSERT/UPDATE/DELETE), old_data (jsonb), new_data (jsonb), user_id, ip_address (inet), created_at. Plus auto-trigger on watched tables." },
        { role: "user", content: "The migration needs to be safe to run on a live table with 50M rows." },
        { role: "assistant", content: "Using CREATE TABLE IF NOT EXISTS and CREATE INDEX CONCURRENTLY so it does not lock. Trigger added last after indexes are built. Added rollback section." },
      ],
      keyPoints: ["audit_log table with jsonb old/new snapshots", "inet type for IP addresses", "Trigger auto-populates on watched tables", "CREATE INDEX CONCURRENTLY — no table lock"],
      constraints: ["Safe on 50M-row live table", "Must include rollback section", "Postgres only"],
      decisions: ["jsonb over separate columns for flexibility", "CONCURRENTLY index to avoid downtime"],
    },
    commit: { sha: "d4b9e12", message: "feat: audit log migration and trigger", author: "Rahul Sharma", date: "2026-05-18T16:30:00Z" },
  }],
};

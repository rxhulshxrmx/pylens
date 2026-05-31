const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ─── Shared mock data ──────────────────────────────────────────────────────────
const USER_ID = "usr-rahul-001";
const WS_ID = "ws-pylens-001";
const WS_SLUG = "pylens";

const ME = {
  id: USER_ID, email: "rahul@pylens.org", username: "rahul",
  first_name: "Rahul", last_name: "Sharma", display_name: "Rahul Sharma",
  avatar_url: "", is_bot: false, joining_date: "2026-01-01",
  cover_image_url: null, date_joined: "2026-01-01T00:00:00Z",
  is_active: true, is_email_verified: true, is_password_autoset: false,
  is_tour_completed: true, mobile_number: null,
  last_workspace_id: WS_ID, user_timezone: "UTC",
  last_login_medium: "email",
  theme: { theme: "light", primary: "#D97A14", background: "#FAF8F4", darkPalette: false },
};

const WORKSPACE = {
  id: WS_ID, name: "PyLens", slug: WS_SLUG,
  logo_url: null, url: "https://pylens.org",
  organization_size: "2-10", total_members: 1,
  total_projects: 2, role: 20, timezone: "UTC",
  created_at: new Date("2026-01-01"), updated_at: new Date(),
  created_by: USER_ID, updated_by: USER_ID, owner: ME,
};

const PROJECTS = [
  {
    id: "proj-001", name: "PyLens Core", identifier: "CORE",
    description: "Core provenance tracking engine, CLI, and VS Code extension",
    sort_order: 1, logo_props: { in_use: "emoji", emoji: { value: "⬡", url: "" } },
    member_role: 20, archived_at: null, workspace: WS_ID,
    cycle_view: true, issue_views_view: true, module_view: true,
    page_view: true, inbox_view: true,
    is_favorite: false, members: [USER_ID],
    default_state: "state-todo-001", network: 2,
    created_at: new Date("2026-01-01"), updated_at: new Date(),
    created_by: USER_ID, updated_by: USER_ID,
    next_work_item_sequence: 102, intake_count: 0,
  },
  {
    id: "proj-002", name: "PyLens Dashboard", identifier: "DASH",
    description: "Web dashboard — issue tracker, provenance viewer, AI session browser",
    sort_order: 2, logo_props: { in_use: "emoji", emoji: { value: "📊", url: "" } },
    member_role: 20, archived_at: null, workspace: WS_ID,
    cycle_view: true, issue_views_view: true, module_view: true,
    page_view: true, inbox_view: false,
    is_favorite: true, members: [USER_ID],
    default_state: "state-todo-002", network: 2,
    created_at: new Date("2026-01-15"), updated_at: new Date(),
    created_by: USER_ID, updated_by: USER_ID,
    next_work_item_sequence: 50, intake_count: 0,
  },
];

const MEMBERS = [{
  id: "mem-001", member: USER_ID, role: 20,
  original_role: 20, created_at: new Date("2026-01-01"),
  member__avatar_url: "", member__display_name: "Rahul Sharma",
  member_id: USER_ID,
}];

const STATES_P1 = [
  { id:"state-backlog-001", name:"Backlog", color:"#9ca3af", group:"backlog", project:"proj-001", sequence:10000, default:false },
  { id:"state-todo-001",    name:"Todo",    color:"#60a5fa", group:"unstarted", project:"proj-001", sequence:20000, default:true },
  { id:"state-prog-001",    name:"In Progress", color:"#fbbf24", group:"started", project:"proj-001", sequence:30000, default:false },
  { id:"state-review-001",  name:"In Review",   color:"#a78bfa", group:"started", project:"proj-001", sequence:40000, default:false },
  { id:"state-done-001",    name:"Done",    color:"#34d399", group:"completed", project:"proj-001", sequence:50000, default:false },
];
const STATES_P2 = [
  { id:"state-backlog-002", name:"Backlog", color:"#9ca3af", group:"backlog", project:"proj-002", sequence:10000, default:false },
  { id:"state-todo-002",    name:"Todo",    color:"#60a5fa", group:"unstarted", project:"proj-002", sequence:20000, default:true },
  { id:"state-prog-002",    name:"In Progress", color:"#fbbf24", group:"started", project:"proj-002", sequence:30000, default:false },
  { id:"state-done-002",    name:"Done",    color:"#34d399", group:"completed", project:"proj-002", sequence:50000, default:false },
];

const LABELS_P1 = [
  { id:"lbl-001", name:"backend", color:"#3b82f6", project:"proj-001", workspace:WS_ID },
  { id:"lbl-002", name:"auth",    color:"#f59e0b", project:"proj-001", workspace:WS_ID },
  { id:"lbl-003", name:"ai",      color:"#8b5cf6", project:"proj-001", workspace:WS_ID },
  { id:"lbl-004", name:"security",color:"#ef4444", project:"proj-001", workspace:WS_ID },
];
const LABELS_P2 = [
  { id:"lbl-005", name:"frontend", color:"#06b6d4", project:"proj-002", workspace:WS_ID },
  { id:"lbl-006", name:"ux",       color:"#ec4899", project:"proj-002", workspace:WS_ID },
  { id:"lbl-007", name:"provenance",color:"#d97706",project:"proj-002", workspace:WS_ID },
];

const now = new Date().toISOString();
const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

const { ISSUES_P1, ISSUES_P2, issueResponse } = require('./issues.js');

// ─── Routes ────────────────────────────────────────────────────────────────────

// CSRF
app.get("/auth/get-csrf-token/", (_, res) => res.json({ csrf_token: "mock-csrf-token-pylens" }));

// Instance
app.get("/api/instances/", (_, res) => res.json({
  instance: {
    id:"inst-001", instance_name:"PyLens", instance_id:"pylens-local",
    license_key:null, current_version:"0.1.0", latest_version:"0.1.0",
    last_checked_at: now, namespace:"pylens", is_telemetry_enabled:false,
    is_support_required:false, is_activated:true, is_setup_done:true,
    is_signup_screen_visited:true, user_count:1, is_verified:true,
    created_by:USER_ID, updated_by:USER_ID, workspaces_exist:true,
    whitelist_emails:null, created_at:d(60), updated_at:now,
  },
  config: {
    enable_signup:true, is_workspace_creation_disabled:false,
    is_google_enabled:false, is_github_enabled:false, is_gitlab_enabled:false,
    is_gitea_enabled:false, is_magic_login_enabled:false,
    is_email_password_enabled:true, github_app_name:null,
    slack_client_id:null, posthog_api_key:null, posthog_host:null,
    has_unsplash_configured:false,
  },
}));

// App config
app.get("/api/configs/", (_, res) => res.json({
  GOOGLE_CLIENT_ID:null, GITHUB_APP_NAME:null, BUCKET_NAME:"pylens-media",
  FILE_SIZE_LIMIT:5242880, IS_SELF_HOSTED:true,
}));

// Current user
app.get("/api/users/me/", (_, res) => res.json(ME));
app.get("/api/users/me/profile/", (_, res) => res.json({
  id:"prof-001", user:USER_ID, role:"admin", last_workspace_id:WS_ID,
  theme:ME.theme, onboarding_step:{ workspace_join:true, profile_complete:true, workspace_create:true, workspace_invite:true },
  is_onboarded:true, is_tour_completed:true, use_case:"Build and track product roadmaps",
  billing_address_country:"US", billing_address:null, has_billing_address:false,
  has_marketing_email_consent:false,
}));
app.get("/api/users/me/instance-admin/", (_, res) => res.json({ is_instance_admin: true }));
app.get("/api/users/me/notification-preferences/", (_, res) => res.json({ email:true, in_app:true, push:false }));
app.get("/api/users/me/accounts/", (_, res) => res.json([]));
app.get("/api/users/me/settings/", (_, res) => res.json({
  id: "settings-001", email: "rahul@pylens.org",
  workspace: {
    last_workspace_id: WS_ID, last_workspace_slug: WS_SLUG,
    last_workspace_name: "PyLens", last_workspace_logo: null,
    fallback_workspace_id: WS_ID, fallback_workspace_slug: WS_SLUG, invites: 0,
  },
}));
app.get("/api/users/last-visited-workspace/", (_, res) => res.json({ workspace_slug: WS_SLUG }));
app.get("/api/release-notes/", (_, res) => res.json([]));
app.get("/api/users/me/workspaces/invitations/", (_, res) => res.json([]));

// Workspaces
app.get("/api/users/me/workspaces/", (_, res) => res.json([WORKSPACE]));
app.get("/api/workspaces/", (_, res) => res.json([WORKSPACE]));
app.get("/api/workspaces/:slug/", (req, res) => res.json(WORKSPACE));
app.get("/api/workspaces/:slug/members/", (_, res) => res.json(MEMBERS));
app.get("/api/workspaces/:slug/members/me/", (_, res) => res.json({ ...MEMBERS[0], workspace: WS_ID }));
app.get("/api/workspaces/:slug/settings/", (_, res) => res.json({ id: WS_ID }));

// Projects
app.get("/api/workspaces/:slug/projects/", (_, res) => res.json(PROJECTS));
app.get("/api/workspaces/:slug/projects/:id/", (req, res) => {
  const p = PROJECTS.find(p => p.id === req.params.id || p.identifier === req.params.id);
  res.json(p ?? PROJECTS[0]);
});
app.get("/api/workspaces/:slug/projects/:id/members/", (_, res) => res.json(MEMBERS));
app.get("/api/workspaces/:slug/projects/:id/members/me/", (_, res) => res.json(MEMBERS[0]));
app.get("/api/workspaces/:slug/projects/:id/states/", (req, res) => {
  res.json(req.params.id === "proj-002" ? STATES_P2 : STATES_P1);
});
app.get("/api/workspaces/:slug/projects/:id/labels/", (req, res) => {
  res.json(req.params.id === "proj-002" ? LABELS_P2 : LABELS_P1);
});
app.get("/api/workspaces/:slug/projects/:id/user-properties/", (_, res) => res.json({ filters:{}, display_filters:{}, display_properties:{} }));
app.get("/api/workspaces/:slug/user-properties/", (_, res) => res.json({ filters:{}, display_filters:{}, display_properties:{} }));

// Issues
app.get("/api/workspaces/:slug/projects/:id/issues/", (req, res) => {
  const issues = req.params.id === "proj-002" ? ISSUES_P2 : ISSUES_P1;
  res.json(issueResponse(issues));
});
app.get("/api/workspaces/:slug/projects/:pid/issues/:iid/", (req, res) => {
  const all = [...ISSUES_P1, ...ISSUES_P2];
  const issue = all.find(i => i.id === req.params.iid || i.sequence_id === parseInt(req.params.iid));
  res.json(issue ?? ISSUES_P1[0]);
});
app.get("/api/workspaces/:slug/projects/:id/issues/:iid/meta/", (req, res) => {
  const all = [...ISSUES_P1, ...ISSUES_P2];
  const issue = all.find(i => i.id === req.params.iid);
  if (issue) res.json({ project_identifier: PROJECTS.find(p=>p.id===issue.project_id)?.identifier, sequence_id: issue.sequence_id });
  else res.status(404).json({ detail: "Not found" });
});
app.get("/api/workspaces/:slug/projects/:id/issue-meta/", (req, res) => {
  res.json({ project_identifier: PROJECTS[0].identifier, sequence_id: 1 });
});

// Activity / comments
app.get("/api/workspaces/:slug/projects/:id/issues/:iid/activities/", (_, res) => res.json({ results:[], total_count:0 }));
app.get("/api/workspaces/:slug/projects/:id/issues/:iid/comments/", (_, res) => res.json([]));
app.get("/api/workspaces/:slug/projects/:id/issues/:iid/attachments/", (_, res) => res.json([]));
app.get("/api/workspaces/:slug/projects/:id/issues/:iid/links/", (_, res) => res.json([]));
app.get("/api/workspaces/:slug/projects/:id/issues/:iid/sub-issues/", (_, res) => res.json({ sub_issues:[], state_distribution:{} }));
app.get("/api/workspaces/:slug/projects/:id/issues/:iid/relations/", (_, res) => res.json([]));

// Cycles / modules (empty — not core to PyLens)
app.get("/api/workspaces/:slug/projects/:id/cycles/", (_, res) => res.json({ results:[], total_count:0 }));
app.get("/api/workspaces/:slug/projects/:id/modules/", (_, res) => res.json([]));
app.get("/api/workspaces/:slug/projects/:id/views/", (_, res) => res.json([]));
app.get("/api/workspaces/:slug/projects/:id/draft-issues/", (_, res) => res.json({ results:[], total_count:0 }));

// Analytics / views at workspace level
app.get("/api/workspaces/:slug/issues/", (_, res) => res.json({ results:[...ISSUES_P1,...ISSUES_P2], total_count: ISSUES_P1.length+ISSUES_P2.length }));
app.get("/api/workspaces/:slug/views/", (_, res) => res.json([]));
app.get("/api/workspaces/:slug/user-profile/", (_, res) => res.json(ME));

// Notifications
app.get("/api/workspaces/:slug/notifications/", (_, res) => res.json({ results:[], total_count:0, next_page_results:false }));
app.get("/api/users/me/notifications/", (_, res) => res.json({ results:[], total_count:0, unread_notification_count:0 }));
app.get("/api/workspaces/:slug/unread-notifications/", (_, res) => res.json({ total_unread_count:0 }));

// Stickies / drafts
app.get("/api/workspaces/:slug/stickies/", (_, res) => res.json({ results:[], total_count:0 }));
app.get("/api/workspaces/:slug/draft-issues/", (_, res) => res.json({ results:[], total_count:0 }));

// Work item type
app.get("/api/workspaces/:slug/projects/:id/work-item-types/", (_, res) => res.json([]));
app.get("/api/workspaces/:slug/work-item-types/", (_, res) => res.json([]));



// ─── PyLens Provenance API ────────────────────────────────────────────────────
const PROVENANCE_DATA = require('./provenance.js');

app.get('/api/pylens/provenance/:issueId/', (req, res) => {
  const records = PROVENANCE_DATA[req.params.issueId] ?? [];
  res.json({ results: records, count: records.length });
});
app.get('/api/pylens/provenance/', (_, res) => {
  const all = Object.values(PROVENANCE_DATA).flat();
  res.json({ results: all, count: all.length });
});

// Catch-all for unhandled GETs — return empty so app does not crash
app.get('/api/*path', (req, res) => {
  console.log('⬡ [mock] unhandled GET', req.path);
  res.json([]);
});

// POST/PATCH/DELETE — acknowledge silently
app.post('/api/*path', (req, res) => { res.json(req.body ?? {}); });
app.patch('/api/*path', (req, res) => { res.json(req.body ?? {}); });
app.delete('/api/*path', (req, res) => { res.json({}); });
app.put('/api/*path', (req, res) => { res.json(req.body ?? {}); });

app.listen(8000, () => console.log('⬡  PyLens mock API running → http://localhost:8000'));

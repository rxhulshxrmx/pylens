# Landing Page + Google Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public landing page at `/`, protect `/dashboard` with Google OAuth via Auth.js v5, and move the existing FactoryWorkspace there.

**Architecture:** Auth.js v5 (`next-auth@beta`) handles Google OAuth with JWT sessions and a root `auth.ts` config. A `middleware.ts` at the root guards `/dashboard/*` (redirect to `/sign-in` if unauthed) and `/sign-in` (redirect to `/dashboard` if already authed). The existing `FactoryWorkspace` component is untouched — it simply moves to `app/dashboard/page.tsx`.

**Tech Stack:** Next.js 15 App Router, Auth.js v5 (`next-auth@beta`), Google OAuth, Tailwind CSS v4, TypeScript

## Global Constraints

- Do NOT modify `app/components/FactoryWorkspace.tsx` or any file under `app/api/` (except the new auth handler)
- Auth.js v5 env vars: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (these are different from `GOOGLE_GENERATIVE_AI_API_KEY` which is for the AI SDK — do not confuse them)
- All UI uses existing CSS variables (`--geist-*`) and Tailwind v4 — no new design tokens
- Server Components by default; add `"use client"` only where required
- No test framework is installed — verification is via `npx tsc --noEmit` + `npm run build` + manual browser steps

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `auth.ts` | Create | NextAuth v5 config — exports `handlers`, `auth`, `signIn`, `signOut` |
| `middleware.ts` | Create | Route protection — guards `/dashboard/*` and `/sign-in` |
| `app/api/auth/[...nextauth]/route.ts` | Create | NextAuth API handler (GET + POST) |
| `app/dashboard/page.tsx` | Create | Protected dashboard — renders `<FactoryWorkspace />` |
| `app/sign-in/page.tsx` | Create | Sign-in page with Google Server Action |
| `app/page.tsx` | Modify | Rewrite as landing page Server Component |
| `.env` | Modify | Add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL` |

---

## Task 1: Install Auth.js v5, create auth.ts and API route handler

**Files:**
- Modify: `package.json` (via npm install)
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Modify: `.env`

**Interfaces:**
- Produces: `auth`, `handlers`, `signIn`, `signOut` exported from `@/auth`

- [ ] **Step 1: Install next-auth@beta**

```bash
cd /Users/rahulsharma/Developer/Factory
npm install next-auth@beta
```

Expected output: `added N packages` with no peer dep errors. If you see a peer dep warning about React, ignore it — Auth.js v5 beta supports React 19.

- [ ] **Step 2: Add env vars to .env**

Open `.env` and append these four lines at the bottom:

```
# Auth.js v5
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID_HERE
AUTH_GOOGLE_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
NEXTAUTH_URL=http://localhost:3000
```

**Important:** Replace `YOUR_GOOGLE_CLIENT_ID_HERE` and `YOUR_GOOGLE_CLIENT_SECRET_HERE` with values from Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID. These are NOT the same as `GOOGLE_GENERATIVE_AI_API_KEY`.

- [ ] **Step 3: Create auth.ts at the project root**

Create file `/Users/rahulsharma/Developer/Factory/auth.ts`:

```ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
})
```

- [ ] **Step 4: Create the NextAuth API route handler**

Create directory `app/api/auth/[...nextauth]/` then create `route.ts`:

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see `Cannot find module 'next-auth'`, run `npm install` again.

- [ ] **Step 6: Commit**

```bash
git add auth.ts app/api/auth/\[...nextauth\]/route.ts .env package.json package-lock.json
git commit -m "feat: add Auth.js v5 config with Google provider"
```

---

## Task 2: Add route-protection middleware

**Files:**
- Create: `middleware.ts` (at project root, same level as `auth.ts`)

**Interfaces:**
- Consumes: `auth` from `@/auth`
- Produces: middleware that redirects `/dashboard/*` → `/sign-in` when unauthed, and `/sign-in` → `/dashboard` when authed

- [ ] **Step 1: Create middleware.ts**

```ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  if (pathname === "/sign-in" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in"],
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect /dashboard with auth middleware"
```

---

## Task 3: Move FactoryWorkspace to /dashboard

**Files:**
- Create: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `FactoryWorkspace` from `../components/FactoryWorkspace`
- Produces: `/dashboard` route rendering the existing app

- [ ] **Step 1: Create app/dashboard/page.tsx**

```tsx
import FactoryWorkspace from "../components/FactoryWorkspace"

export default function DashboardPage() {
  return <FactoryWorkspace />
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: builds successfully. The `/dashboard` route should appear in the output.

- [ ] **Step 3: Manual browser check**

Start dev server (`npm run dev`) and visit `http://localhost:3000/dashboard`. Since middleware runs and you have no session, you should be redirected to `/sign-in`. That page doesn't exist yet — you'll get a 404. That's expected at this stage. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: move FactoryWorkspace to /dashboard"
```

---

## Task 4: Build the sign-in page

**Files:**
- Create: `app/sign-in/page.tsx`

**Interfaces:**
- Consumes: `auth`, `signIn` from `@/auth`
- Produces: `/sign-in` page with a Google sign-in Server Action; redirects to `/dashboard` if already authenticated

- [ ] **Step 1: Create app/sign-in/page.tsx**

```tsx
import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { Sparkles } from "lucide-react"

export default async function SignInPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect("/dashboard")

  const { error } = await props.searchParams

  async function handleSignIn() {
    "use server"
    await signIn("google", { redirectTo: "/dashboard" })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--geist-background-100)]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)]">
            <Sparkles size={20} className="text-[var(--geist-background-100)]" />
          </div>
          <h1 className="text-xl font-semibold tracking-[-0.5px]">Sign in to Factory</h1>
          <p className="text-center text-sm text-[var(--geist-gray-800)]">
            Turn product intent into shipped software.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-[var(--geist-radius-sm)] border border-[var(--geist-red-700)] bg-[var(--geist-red-100)] px-3 py-2 text-center text-sm text-[var(--geist-red-700)]">
            Sign-in failed. Please try again.
          </div>
        )}

        <div className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-5">
          <form action={handleSignIn}>
            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-3 rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] text-sm font-medium text-[var(--geist-primary)] transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual browser check**

Run `npm run dev` and visit `http://localhost:3000/sign-in`. You should see:
- Factory logo + "Sign in to Factory" heading
- "Continue with Google" button with Google icon
- Dark background matching the existing app

Click the button — it should redirect to Google's OAuth consent screen. After approving, you should land on `/dashboard` (which shows `FactoryWorkspace`). Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/sign-in/page.tsx
git commit -m "feat: add sign-in page with Google OAuth"
```

---

## Task 5: Build the landing page

**Files:**
- Modify: `app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `auth` from `@/auth`
- Produces: `/` landing page — shows session-aware CTAs (sign-in vs go-to-dashboard)

- [ ] **Step 1: Rewrite app/page.tsx**

```tsx
import { auth, signIn } from "@/auth"
import Link from "next/link"
import { Sparkles, FileText, Ticket, ClipboardList } from "lucide-react"

export default async function LandingPage() {
  const session = await auth()

  async function handleSignIn() {
    "use server"
    await signIn("google", { redirectTo: "/dashboard" })
  }

  return (
    <div className="min-h-screen bg-[var(--geist-background-100)] text-[var(--geist-primary)]">
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--geist-gray-alpha-200)] px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)]">
            <Sparkles size={15} className="text-[var(--geist-background-100)]" />
          </div>
          <span className="text-sm font-semibold">Factory</span>
        </div>

        {session ? (
          <Link
            href="/dashboard"
            className="flex h-8 items-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-200)] px-3 text-sm font-medium transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="flex h-8 items-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-200)] px-3 text-sm font-medium transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
          >
            Sign in
          </Link>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] px-3 py-1 text-xs text-[var(--geist-gray-800)]">
          <Sparkles size={11} />
          AI Software Factory
        </div>

        <h1 className="mt-4 max-w-2xl text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[1.1] tracking-[-2px] text-[var(--geist-primary)]">
          Turn product intent into shipped software.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-[var(--geist-gray-800)]">
          Describe what you want to build. Factory generates feature specs, Jira-ready tickets, a Kanban board, and file blueprints — all driven by agents.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className="flex h-10 items-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-5 text-sm font-semibold text-[var(--geist-background-100)] transition-colors hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          ) : (
            <form action={handleSignIn}>
              <button
                type="submit"
                className="flex h-10 items-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-5 text-sm font-semibold text-[var(--geist-background-100)] transition-colors hover:opacity-90"
              >
                Get started with Google
              </button>
            </form>
          )}
          <Link
            href="/sign-in"
            className="flex h-10 items-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] px-5 text-sm font-medium transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto grid w-full max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        <FeatureCard
          icon={FileText}
          title="Feature Specs"
          description="AI generates structured specs from a plain-text product description."
        />
        <FeatureCard
          icon={Ticket}
          title="Jira-ready Tickets"
          description="Each spec becomes scoped, prioritised tickets with acceptance criteria."
        />
        <FeatureCard
          icon={ClipboardList}
          title="Kanban Board"
          description="Move tickets through Backlog → Ready → In Progress → Review → Done."
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--geist-gray-alpha-200)] py-6 text-center text-xs text-[var(--geist-gray-700)]">
        Factory — built with Next.js and Claude
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText
  title: string
  description: string
}) {
  return (
    <div className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-100)]">
        <Icon size={16} className="text-[var(--geist-blue-700)]" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--geist-gray-800)]">{description}</p>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: successful build. All three routes (`/`, `/sign-in`, `/dashboard`) appear in the output.

- [ ] **Step 4: Full manual flow check**

Run `npm run dev` and verify:

1. Visit `http://localhost:3000` — landing page loads with hero, 3 feature cards, footer. Topbar shows "Sign in" button (you're not authed yet).
2. Click "Get started with Google" or "Sign in" — lands on `/sign-in`.
3. Click "Continue with Google" — Google OAuth flow completes, lands on `/dashboard` (FactoryWorkspace).
4. Navigate back to `http://localhost:3000` — topbar now shows "Dashboard" button. Hero shows "Go to Dashboard" instead of the sign-in form.
5. Visit `http://localhost:3000/sign-in` while authenticated — middleware redirects to `/dashboard`.
6. Sign out: open browser dev tools → Application → Cookies → delete `authjs.session-token` → refresh `/dashboard` — middleware redirects to `/sign-in`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with session-aware CTAs"
```

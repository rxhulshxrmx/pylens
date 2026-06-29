---
name: landing-auth-design
description: Landing page + Google OAuth via Auth.js v5 for the Factory app, with protected /dashboard route
metadata:
  type: project
---

# Landing Page + Auth — Factory

**Date:** 2026-06-29  
**Status:** Approved

## Overview

Add a public landing page at `/` and wire up Google OAuth via Auth.js v5 (next-auth@beta). The existing `FactoryWorkspace` moves to `/dashboard`, which is protected by middleware. Unauthenticated users land on the landing page or sign-in page; authenticated users go straight to `/dashboard`.

---

## Route Structure

| Route | Access | Content |
|---|---|---|
| `/` | Public | Landing page — hero, feature highlights, sign-in CTA |
| `/sign-in` | Public (redirects to `/dashboard` if already authed) | Sign-in page with Google button |
| `/dashboard` | Protected | `FactoryWorkspace` (existing app) |
| `/api/auth/[...nextauth]` | Public | NextAuth API handler |

Middleware protects `/dashboard` and all sub-paths. Any unauthenticated request to `/dashboard/*` redirects to `/sign-in`. Authenticated requests to `/sign-in` redirect to `/dashboard`.

---

## Authentication

**Provider:** Auth.js v5 (`next-auth@beta`) with Google OAuth  
**Session strategy:** JWT (default for Auth.js v5; no database adapter needed for sessions)  
**Env vars required:**
```
NEXTAUTH_SECRET=<random 32-char secret>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXTAUTH_URL=http://localhost:3000   # production: actual domain
```

**`auth.ts` (root):** exports `{ auth, handlers, signIn, signOut }` from NextAuth configured with GoogleProvider.

**`middleware.ts` (root):** uses `auth` as middleware. Redirects unauthenticated `/dashboard` requests to `/sign-in`; redirects authenticated `/sign-in` requests to `/dashboard`.

---

## Landing Page (`/`)

Design matches the existing Geist token palette (`--geist-background-100/200`, `--geist-primary`, `--geist-gray-*`).

**Sections:**
1. **Topbar** — Factory logo (Sparkles icon + "Factory" wordmark) left; "Sign in" button right. If session exists, button reads "Go to Dashboard".
2. **Hero** — Large headline: *"Turn product intent into shipped software."* Subheadline describing Factory (specs, tickets, board, agents). Primary CTA: "Get started with Google" → `/api/auth/signin/google?callbackUrl=/dashboard`. Secondary CTA: "View Dashboard" (only shown when session exists) → `/dashboard`.
3. **Feature grid** — 3 cards: Feature Specs, Jira-ready Tickets, Kanban Board.
4. **Footer** — minimal, single line.

Landing page is a Server Component. It reads the session via `auth()` to conditionally show "Go to Dashboard" vs "Sign in".

---

## Sign-in Page (`/sign-in`)

Simple centered card. Google sign-in button calls `signIn("google", { callbackUrl: "/dashboard" })` from a small Client Component button. No email/password form. If session already exists (checked in the page's Server Component), redirects to `/dashboard` via `redirect()`.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `auth.ts` | Create — NextAuth v5 config with Google provider |
| `middleware.ts` | Create — route protection logic |
| `app/api/auth/[...nextauth]/route.ts` | Create — NextAuth handler |
| `app/page.tsx` | Rewrite — landing page (Server Component) |
| `app/dashboard/page.tsx` | Create — renders `<FactoryWorkspace />` |
| `app/sign-in/page.tsx` | Create — sign-in page |
| `app/sign-in/SignInButton.tsx` | Create — `"use client"` Google sign-in button |
| `.env` | Update — add `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL` |

No changes to `FactoryWorkspace.tsx` or any API routes.

---

## Error Handling

- If Google OAuth fails, Auth.js redirects to `/sign-in?error=...`. The sign-in page shows a generic error banner when the `error` query param is present.
- No custom error page needed; Auth.js default error handling is sufficient.

---

## Out of Scope

- Email/password credentials
- User profile management
- Role-based access control
- Database session storage (JWT sessions are sufficient)

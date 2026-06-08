# pylens
I want to build an ide extension. You know like we add debugging points, similar to it, and the goal of it is to store user conversation or its conversation chats. The problem I faced is as projects grows complex, making modifications entirely from llms/ claude misses few points or the importance why it was written, so that dot or something to mark with stores that. So whenever llm work through that file again, it can extract info from that point to understant why it was written, and they kind a link throughout files/ folder, and can be tracked at granular level such as functions and variable. its for llm to see and wwork on, user can also see that. Im inspired from gitlens extension but for my problem


This is actually a strong idea, and it solves a problem many people are starting to hit with AI-assisted coding.

The core issue isn't that the LLM can't read the code. It's that the LLM can't reliably reconstruct the *intent* behind the code months later.

Git tells us:

* What changed
* Who changed it
* When it changed

But it doesn't tell us:

* Why this weird workaround exists
* Why a parameter must stay above 0.7
* Why a function is intentionally duplicated
* Why a seemingly dead variable should not be removed
* What business decision led to this implementation

When Claude/Codex/GPT revisits the code later, it often "cleans up" things that were intentionally designed.

## What you're really building

Think of it as:

**GitLens + Architectural Memory + LLM Context Layer**

Instead of:

```python
def calculate_score(x):
    ...
```

You attach a memory node:

```python
@memory(MEM-124)
def calculate_score(x):
    ...
```

or visually through the IDE.

Memory:

```yaml
id: MEM-124

reason:
  Customer ranking became unstable when
  we switched from percentile scoring.

decision:
  Keep min-max normalization.

created_by:
  Rahul

date:
  2026-06-08
```

An LLM working on that file later would receive:

> Before modifying calculate_score(), note:
> This implementation intentionally uses min-max normalization because percentile scoring caused ranking instability in production.

This is extremely valuable.

---

## I would not store it in comments

Many people would immediately think:

```python
# WHY:
# Don't remove this.
```

Problems:

* Pollutes code
* Refactoring breaks links
* Developers delete comments
* Hard to query globally

Instead create a separate metadata graph.

Example:

```text
project/
│
├── src/
│   └── scoring.py
│
└── .memory/
    ├── nodes/
    ├── links/
    └── embeddings/
```

Node:

```json
{
  "id": "MEM-124",
  "file": "src/scoring.py",
  "symbol": "calculate_score",
  "reason": "...",
  "created_at": "...",
  "tags": ["ranking", "production"]
}
```

---

## Granularity is the key

You mentioned:

> functions and variable

This is exactly right.

The hierarchy could be:

```text
Project
 ├─ Folder
 │
 ├─ File
 │
 ├─ Class
 │
 ├─ Function
 │
 └─ Variable
```

Each can have memories attached.

Example:

```text
File:
  auth.py

Function:
  login_user()

Variable:
  MAX_RETRY_COUNT
```

Every level can contain intent.

---

## The killer feature: Relationships

GitLens shows commit history.

You should show:

```text
login_user()
    │
    ├── depends on
    │
    validate_token()
    │
    ├── related memory
    │
    refresh_token()
```

Visual graph:

```text
MEM-1
  │
  ├── caused
  │
MEM-2
  │
  ├── depends on
  │
MEM-3
```

This becomes a knowledge graph of architectural decisions.

---

## How AI would use it

Imagine a Claude Code hook.

When Claude opens:

```python
auth.py
```

Your extension automatically sends:

```text
Relevant memories:

MEM-14
Do not replace JWT verification library.
Compliance requirement.

MEM-22
Token expiry intentionally set to 8 hours.
Customer request.
```

before the file contents.

Now Claude is coding with organizational memory.

---

## Another powerful feature

### "Explain why"

Right-click:

```python
validate_token()
```

Select:

```text
Explain why this exists
```

The extension retrieves:

* linked memories
* git commits
* issue references
* PR references

and generates:

> This function was introduced after OAuth migration in March 2026 to support backward compatibility with legacy clients.

That's incredibly useful for onboarding.

---

## Technical architecture

### VS Code Extension

Use:

* TypeScript
* VS Code Extension API

Track:

* Cursor position
* Symbol selection
* AST nodes

For symbol extraction:

* Tree-sitter
* Language Server Protocol (LSP)

---

### Storage

Initially:

```text
SQLite
```

Tables:

```sql
memories
symbols
links
embeddings
```

Later:

* Neo4j (knowledge graph)
* PostgreSQL + pgvector

---

### Retrieval

When user or LLM opens a file:

1. Parse symbols
2. Find attached memories
3. Retrieve linked memories
4. Rank by relevance
5. Inject into LLM context

This becomes RAG for code intent.

---

## What I would build first (MVP)

Forget variables, embeddings, and AI.

Build:

### V1

* Right click function
* Add Memory
* Store note
* Visual indicator beside line number
* Hover to see memory

Exactly like a breakpoint.

```text
● login_user()
```

Click:

```text
WHY:
Legacy support for old clients.
```

---

### V2

* File memories
* Function memories
* Search memories

---

### V3

* Relationship graph

```text
MEM-1 -> MEM-2 -> MEM-3
```

---

### V4

* Claude Code integration
* Cursor integration
* GitHub Copilot integration

Inject memories automatically.

---

The strongest positioning is not "GitLens for AI."

It's:

> "A persistent architectural memory layer for AI-assisted software development."

Git preserves code history. Your extension preserves engineering intent. As codebases become increasingly AI-generated, preserving intent may become as important as preserving the code itself.

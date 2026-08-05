# Git Ignore Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep product source and project documentation in Git while excluding secrets, generated artifacts, local Supabase state, and AI agent, skill, and rule files.

**Architecture:** Expand the root `.gitignore` with grouped, explicit patterns. Avoid a global Markdown ignore so PRDs, specifications, and normal documentation remain trackable.

**Tech Stack:** Git ignore pattern syntax, POSIX shell validation

## Global Constraints

- Preserve `README.md`, PRDs, `specs/`, normal `docs/`, application source, tests, and future Supabase migrations.
- Ignore `.env*` except `.env.example`.
- Ignore AI agent, skill, workflow, rule, and prompt files without a global `*.md` rule.
- Do not delete any existing file.

---

### Task 1: Expand the repository ignore policy

**Files:**
- Modify: `.gitignore`

**Interfaces:**
- Consumes: approved policy in `docs/superpowers/specs/2026-07-23-gitignore-policy-design.md`
- Produces: root Git ignore patterns used when the repository is initialized

- [ ] **Step 1: Record the current ignore file**

Run: `sed -n '1,240p' .gitignore`

Expected: the existing Next.js, test-output, environment, macOS, and TypeScript patterns are visible.

- [ ] **Step 2: Replace it with categorized explicit patterns**

Add categories for dependencies, builds, tests, logs, environment secrets, editor files, Supabase local state, AI tooling directories, instruction filenames, and the Figma agent prompt. Keep `!.env.example` and do not add `*.md`.

- [ ] **Step 3: Validate representative paths without requiring an initialized repository**

Run a temporary Git repository with the completed `.gitignore`, then check representative ignored and retained paths using `git check-ignore`.

Expected ignored: `.env.local`, `supabase/.temp/project-ref`, `AGENTS.md`, `.agents/workflows/example.md`, `agent-library/example.md`, `.specify/commands/example.md`, `nested/SKILL.md`, `figma-ui-agent-master-prompt-ko.md`.

Expected retained: `README.md`, `hygiene-technology-portfolio-prd.md`, `specs/003-customer-admin-auth/spec.md`, `docs/project/deferred-backend-integration.md`, `supabase/migrations/20260723000000_init.sql`.

- [ ] **Step 4: Confirm no secret file exception is too broad**

Run: `rg -n '^\*\.md$|^!\.env\.local$|SUPABASE_DATABASE_PASSWORD' .gitignore`

Expected: no matches.

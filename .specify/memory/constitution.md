<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Added principles: PRD authority, frontend-only adapter boundary, test-first delivery,
  accessibility/responsiveness, deferred-integration traceability
- Added sections: Product and technology constraints; Workflow and quality gates
- Templates reviewed: plan/spec/tasks templates require no structural changes
- Modified principle: frontend boundary now permits an explicitly planned mock auth adapter
  while prohibiting seeded administrator/super-administrator credentials
- Modified constraint: `/admin` is no longer directly accessible and uses a client mock guard
  until server-verified Supabase authorization replaces it
- Follow-up items: implement Supabase server session checks, RLS, initial super-admin runbook,
  rate limiting, password reset, and audit events before production
-->
# 위생의 기술 포트폴리오 Constitution

## Core Principles

### I. PRD Authority
`hygiene-technology-portfolio-prd.md` MUST be the final authority for product scope,
service taxonomy, behavior, copy constraints, accessibility, and acceptance criteria.
When a design PDF or prompt conflicts with the PRD, the implementation MUST follow the
PRD while preserving the design's reusable visual language where compatible.

### II. Replaceable Frontend Data Boundary
The current milestone MUST remain frontend-only: no Supabase, database, server storage,
service-role secrets, or production backend API. An explicitly planned mock authentication
adapter MAY model customer session flows, but MUST NOT be described as a security boundary,
persist plaintext passwords, seed administrator or super-administrator credentials, or grant
administrator success sessions. UI code MUST consume typed repository interfaces so future
Supabase adapters can replace mock stores without rewriting page components. `/admin` MUST
show an authentication guard and remain unavailable until a trusted administrator session exists.

### III. Test-First Delivery (NON-NEGOTIABLE)
Every behavior MUST follow Red-Green-Refactor: add a focused failing test, confirm the
expected failure, implement the smallest passing change, and refactor only while tests
remain green. Route-level and user-flow behavior MUST have Playwright coverage; pure
state and validation behavior MUST have unit coverage.

### IV. Accessible Responsive Parity
Customer and administrator flows MUST work at 390px mobile and 1440px desktop reference
sizes. Interactive targets MUST be at least 44x44px, keyboard focus MUST be visible,
dialogs MUST manage focus, reduced motion MUST be respected, and status MUST never rely
on color alone. Core content MUST remain readable without hiding essential information
behind hover-only interactions.

### V. Deferred Integration Traceability
Every temporary frontend substitute MUST be recorded in
`docs/project/deferred-backend-integration.md` with its current behavior, production
replacement, migration risks, validation work, and completion checkbox. A feature MUST
not be described as production-ready while any security, persistence, upload, SEO, or
deployment item in that document remains unresolved.

## Product and Technology Constraints

- Product services are bathroom, air conditioner, apartment window, and commercial
  window cleaning. Alternate labels in design files MUST NOT replace these categories.
- The target stack is Next.js 16.2.x App Router, React, TypeScript strict mode, Node.js
  24 LTS, pnpm, Tailwind CSS 4, shadcn/ui, Radix UI, and Lucide React.
- Mock case records and publish state persist in `localStorage`. User-selected image
  files remain session-only via object URLs; after reload they fall back to seeded mock
  media. Image blobs MUST NOT be stored in `localStorage`.
- Client validation MUST enforce at most 20 selected files per batch, 69 images per case,
  supported image types, and the PRD's publish checklist.
- Private cases and private media MUST be excluded from all customer-facing lists,
  counts, related content, routes, and previews even in mock mode.
- YAGNI applies: no fake server API, database client, or storage SDK. The approved mock auth
  adapter is limited to customer UI flow validation and locked administrator states.

## Workflow and Quality Gates

Spec Kit owns requirements, clarification, planning, and ordered task generation.
Superpowers owns TDD implementation, debugging, review, verification, and branch finish.
The approved `tasks.md` is the implementation contract and MUST NOT be rewritten during
execution. Before completion, the project MUST pass lint, type checking, unit/component
tests, Playwright flows, and a production build. Responsive screenshots and keyboard
flows MUST be reviewed against the PRD and compatible design references.

## Governance

This constitution governs all feature specifications, plans, tasks, implementation, and
reviews in this repository. Amendments require an explicit rationale, affected-artifact
review, semantic version change, and user approval. Every plan and final review MUST
check compliance. Deviations MUST be documented before implementation and may not weaken
privacy, accessibility, or the PRD authority principle.

**Version**: 1.1.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-23

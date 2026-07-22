# Implementation Plan: 위생의 기술 프런트엔드 목업 포트폴리오

**Branch**: `001-frontend-mock-portfolio` (virtual; repository has no Git metadata) | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-frontend-mock-portfolio/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build the complete customer and administrator UI described by the PRD as a frontend-only
Next.js application. Seeded content provides deterministic server-rendered public pages;
a typed repository and client store apply administrator edits from `localStorage`. Actual
selected files use session-only object URLs and revert to seeded placeholders after reload.
All backend, authentication, database, remote storage, and production operations work is
explicitly deferred and tracked in one completion checklist.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript strict mode, React, Node.js 24 LTS

**Primary Dependencies**: Next.js 16.2.x App Router, Tailwind CSS 4, shadcn/ui,
Radix UI, Lucide React, Zod, React Hook Form, Uppy Core, Yet Another React Lightbox

**Storage**: Versioned browser `localStorage` for JSON mock records; static seed data and
placeholder media under the repository; session-only object URLs for selected files

**Testing**: Vitest, React Testing Library, axe checks, Playwright, Next.js production build

**Target Platform**: Modern evergreen browsers; reference viewports 390x844 and 1440px wide

**Project Type**: Single responsive web application with public and administrator route groups

**Performance Goals**: PRD targets of LCP <= 2.5s, CLS <= 0.1, INP <= 200ms under the
documented local validation profile; only one hero image receives eager priority; no
YouTube iframe loads before user intent

**Constraints**: No Supabase, auth, database, server API, remote storage, TUS, service role,
or production deployment integration. PRD overrides conflicting design content. Public
screens never reveal private records. Batch limit 20 and case limit 69. `localStorage`
must never contain image blobs or data URLs.

**Scale/Scope**: Five independently testable user stories; 4 services; 20+ responsive route
states; seeded portfolio dataset large enough to validate 12-card desktop and 10-card mobile
initial lists, filtering, and load-more behavior

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **PRD Authority**: PASS. Service taxonomy, 20/69 limits, public/private behavior, and
  customer/admin scope follow the PRD; incompatible PDF labels are treated as styling only.
- **Replaceable Frontend Data Boundary**: PASS. Pages consume typed selectors and repository
  contracts; only the local adapter knows browser persistence.
- **Test-First Delivery**: PASS. Every behavior task begins with a failing focused test and
  the final gates include unit, component, E2E, lint, typecheck, and build.
- **Accessible Responsive Parity**: PASS. 390px/1440px validation, 44px targets, focus
  management, reduced motion, and non-color status cues are explicit tasks.
- **Deferred Integration Traceability**: PASS. One versioned checklist owns every temporary
  substitution and production completion condition.

**Post-Phase-1 re-check**: PASS. The data model, repository contract, route contract, and
quickstart preserve all five principles without exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-mock-portfolio/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── (site)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── services/page.tsx
│   ├── services/[service]/page.tsx
│   ├── portfolio/page.tsx
│   ├── portfolio/[slug]/page.tsx
│   ├── pricing/page.tsx
│   ├── process/page.tsx
│   ├── about/page.tsx
│   ├── privacy/page.tsx
│   └── @modal/(.)portfolio/[slug]/page.tsx
├── admin/
│   ├── layout.tsx
│   ├── page.tsx
│   └── portfolio/
│       ├── page.tsx
│       ├── new/page.tsx
│       └── [id]/edit/page.tsx
├── layout.tsx
├── not-found.tsx
└── globals.css

components/
├── ui/
├── site/
├── portfolio/
└── admin/

features/
├── portfolio/
│   ├── model/
│   ├── data/
│   ├── repository/
│   ├── selectors/
│   └── ui/
├── uploads/
│   ├── model/
│   └── ui/
└── publishing/
    ├── model/
    └── ui/

lib/
├── routes.ts
├── youtube.ts
├── metadata.ts
└── cn.ts

public/mock-media/

tests/
├── unit/
├── component/
├── e2e/
└── fixtures/
```

**Structure Decision**: Use one App Router application, split by product feature and route
responsibility. Shared primitives live in `components/ui`; domain behavior stays under
`features/`; route files compose components and do not implement persistence. No backend
directory or fake API layer is created.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
No constitution violations require justification.

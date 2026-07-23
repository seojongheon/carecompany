# Implementation Plan: Supabase 전체 연동

**Branch**: `main` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-supabase-full-integration/spec.md`

## Summary

연결된 Supabase 프로젝트에 인증·역할·포트폴리오·사이트 콘텐츠 스키마와 RLS를 마이그레이션으로 구축한다. Next.js는 `@supabase/ssr`의 쿠키 세션과 `proxy.ts`를 사용하고, 공개 읽기와 관리자 변경을 Supabase 어댑터 및 서버 작업으로 전환한다. Storage 설정은 별도 SQL과 fail-closed 어댑터로 준비하되 원격에는 적용하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5.9, SQL/PostgreSQL 17, Node.js 24 LTS

**Primary Dependencies**: Next.js 16.2.11, React 19.2, `@supabase/supabase-js`, `@supabase/ssr`, Supabase CLI

**Storage**: Supabase PostgreSQL; Supabase Storage is prepared but disabled

**Testing**: Vitest, Testing Library, Playwright, pgTAP through Supabase CLI

**Target Platform**: Vercel-compatible Next.js runtime and linked hosted Supabase project

**Project Type**: Full-stack web application

**Performance Goals**: Public list/detail data visible within 2 seconds on standard broadband; published changes visible on a new request within 5 seconds

**Constraints**: RLS on all exposed tables; no seeded administrator credentials; Storage disabled by default; no automatic localStorage migration; 69 images, 3 videos, 1 cover per case

**Scale/Scope**: Four services, tens to low thousands of cases, low-volume administrator operations

## Constitution Check

- **PRD Authority**: Pass. Service keys and publish checklist remain unchanged.
- **Trusted Supabase Data Boundary**: Pass. RLS, server claims validation, private helper schema, and server-only secrets are required.
- **Test-First Delivery**: Pass. SQL policy tests and TypeScript tests precede adapters and route changes.
- **Accessible Responsive Parity**: Pass. Existing forms remain and new loading/error states use semantic status content.
- **Deferred Integration Traceability**: Pass. Completed database/auth items and deferred Storage activation remain explicitly documented.
- **Remote safety gate**: Pass. Run migration list and `db push --dry-run` before any linked push; never run linked reset.

## Project Structure

### Documentation (this feature)

```text
specs/004-supabase-full-integration/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth.md
│   ├── content-operations.md
│   └── role-management.md
└── tasks.md
```

### Source Code

```text
supabase/
├── config.toml
├── migrations/
├── seed.sql
├── tests/database/
└── storage/
    ├── enable-storage.sql
    └── README.md

lib/supabase/
├── client.ts
├── server.ts
├── proxy.ts
├── env.ts
└── database.types.ts

features/auth/
├── repository/supabase-auth-repository.ts
└── server/authorization.ts

features/portfolio/repository/
├── supabase-mappers.ts
└── supabase-portfolio-repository.ts

features/site-content/repository/
└── supabase-site-content-repository.ts

app/actions/
├── auth.ts
├── portfolio.ts
├── site-content.ts
└── roles.ts

tests/
├── unit/
├── component/
└── e2e/

proxy.ts
```

**Structure Decision**: Existing feature boundaries and UI are retained. Supabase-specific clients live in `lib/supabase`; each feature owns mapping and repository behavior; trusted mutations live in server actions. Browser mock repositories remain test fixtures.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Client and server Supabase clients | SSR cookie refresh and server authorization require separate cookie capabilities | A browser-only client cannot protect `/admin` server rendering |
| Private SQL helper schema plus RPC | RLS role checks and atomic publication must bypass recursive policies safely | Direct client writes cannot enforce cross-row publication invariants |

## Post-Design Constitution Check

All gates remain satisfied. The public site reads only published projections; administrative changes require an active admin role; role changes require an active super administrator; Storage remains fail-closed.

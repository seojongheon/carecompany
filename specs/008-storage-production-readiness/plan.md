# Implementation Plan: 운영 이미지 Storage 활성화

**Branch**: `main` | **Date**: 2026-08-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-storage-production-readiness/spec.md`

## Summary

기존 사례 이미지용 비공개 버킷과 RLS를 강화하고, 업로드/메타데이터 저장/삭제를 보상 가능한 작업으로 만든다. 랜딩 대표 이미지에도 비공개 Storage 버킷과 게시 참조 기반 읽기 정책을 추가하고, 브라우저 UI를 실제 업로드 및 서명 URL 조회에 연결한다. 활성화는 마이그레이션·정책 테스트·애플리케이션 검증 후 Vercel 환경변수를 `true`로 설정하는 마지막 단계로 둔다.

## Technical Context

**Language/Version**: TypeScript 5.9, SQL/PostgreSQL, Node.js 24 LTS

**Primary Dependencies**: Next.js 16.2, React 19, `@supabase/supabase-js`, `@supabase/ssr`, Zod

**Storage**: Supabase PostgreSQL, Supabase Storage private buckets, JSON site-content versions

**Testing**: Vitest, Testing Library, pgTAP/Supabase CLI, Playwright

**Target Platform**: Vercel production deployment and Supabase hosted project

**Project Type**: Next.js web application with customer site and protected administrator CMS

**Performance Goals**: Public images appear within one normal page load; signed URLs are issued in one batched request per image group; uploads remain serial to avoid browser memory spikes.

**Constraints**: 20MB per input, 20 files per selection, 69 images per case, WebP reviewed copies, no service-role secret in the browser, existing dirty worktree preserved.

**Scale/Scope**: Case image upload/read/delete and one landing hero image; video and general file uploads are out of scope.

## Constitution Check

- **PRD authority**: Pass. Existing image limits and publish checklist remain authoritative.
- **Trusted Supabase boundary**: Pass. Authorization is enforced by RLS and existing active-admin functions; the browser receives only publishable credentials.
- **Test-first delivery**: Pass. Each storage gateway, policy, UI, and cleanup behavior receives a failing test before implementation.
- **Accessible responsive parity**: Pass. Existing accessible dropzones and status messages are retained; new error/status output uses semantic live regions.
- **Deferred integration traceability**: Pass. Storage deferral entries and activation documentation are updated only after validation.

Post-design re-check: no constitutional exceptions are required. Storage remains fail-closed until the migration and checks are complete.

## Project Structure

### Documentation (this feature)

```text
specs/008-storage-production-readiness/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── image-storage.md
└── tasks.md
```

### Source Code

```text
features/portfolio/storage/
├── storage-gateway.ts
└── use-case-media-urls.ts
features/uploads/
├── model/upload-constraints.ts
├── model/upload-runtime.ts
└── ui/{upload-panel,photo-manager}.tsx
features/site-content/
├── repository/supabase-site-content-repository.ts
└── ui/landing-hero-image-manager.tsx
supabase/migrations/
supabase/tests/database/
tests/unit/storage/
tests/component/
docs/project/
```

**Structure Decision**: 기존 기능별 디렉터리와 repository/gateway 경계를 유지한다. Storage 객체 조작은 전용 gateway에 모으고 UI는 결과와 재시도 상태만 관리한다.

## Complexity Tracking

구성 원칙 위반이 없으므로 별도 예외는 없다.

# Implementation Plan: 관리자 홈페이지 콘텐츠 관리

**Branch**: `002-admin-site-content-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: 기존 사례 관리자 UI를 확장하여 고객용 사이트 콘텐츠를 초안·미리보기·게시 흐름으로 관리한다.

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

기존 포트폴리오 저장소와 분리된 사이트 콘텐츠 저장소를 도입한다. 초기 콘텐츠를 기준값으로 제공하고, 관리자 변경은 브라우저 `localStorage`에 초안과 게시 스냅샷으로 저장한다. 고객용 React 컴포넌트는 게시 스냅샷을 구독하므로 관리자가 게시하면 새로고침 없이 같은 브라우저의 고객 화면에 반영된다. 현재 목업의 이미지 파일은 외부 업로드 대신 기존 mock-media 키를 선택하는 방식으로 검증한다.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9, React 19, Next.js 16

**Primary Dependencies**: Next App Router, React Hook Form, Zod, Vitest, Testing Library

**Storage**: 브라우저 `localStorage`; 이미지 파일은 seed/mock asset 키만 참조

**Testing**: Vitest unit/component, Playwright E2E, lint, typecheck, production build

**Target Platform**: 모바일 390px와 데스크톱 1440px 웹 브라우저

**Project Type**: Next.js 단일 웹 애플리케이션

**Performance Goals**: 관리자 입력 중 즉시 상태 표시, 게시 후 고객용 화면의 다음 렌더에 반영

**Constraints**: 프런트엔드 목업만 구현; 인증·DB·원격 파일 업로드·실제 권한은 후속 연동으로 보류; 기존 사례 관리 동작 보존

**Scale/Scope**: 홈, 서비스, 가격, 작업 과정, 업체 소개, 사이트 설정의 텍스트·노출·정렬·mock 이미지; 초안/게시 및 최근 버전 복원

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PRD authority: 통과. PRD의 콘텐츠 전용 편집 경계와 사례 가격 비노출 원칙을 따른다.
- Replaceable frontend data boundary: 통과. 별도 typed repository/provider를 두어 후속 저장소 어댑터로 교체 가능하다.
- Test-first delivery: 통과 조건. 새 저장소와 관리자-고객 반영 흐름은 실패 테스트부터 작성한다.
- Accessible responsive parity: 통과 조건. 390px/1440px, 포커스, 상태 알림을 테스트한다.
- Deferred integration traceability: 통과. 후속 백엔드 체크리스트를 갱신한다.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-site-content-management/
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
├── (site)/                 # 고객 페이지 route
└── admin/site/             # 사이트 콘텐츠 관리자 route
features/site-content/
├── model/                  # 타입, 검증, 초기값
├── repository/             # localStorage 저장소와 React provider
└── ui/                     # 고객용 섹션과 관리자 편집 UI
components/admin/           # 공통 관리자 shell/navigation
tests/
├── unit/                   # 저장소·게시 검증
└── component/              # 관리자 편집과 고객 화면 반영
```

**Structure Decision**: 기존 포트폴리오 기능과 독립된 `features/site-content`를 사용한다. 고객용과 관리자용 UI는 같은 게시 상태를 구독하고, 기존 관리자 shell은 확장한다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 없음 | - | - |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

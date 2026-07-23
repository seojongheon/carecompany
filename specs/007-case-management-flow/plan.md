# Implementation Plan: 사례 관리 중심 편집과 전후 사진 구분

**Branch**: `main` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

## Summary

관리자 생성 진입을 사례 관리 화면으로 모으고, 공통 업로드 패널에 명시적 미디어 단계를 주입하여 작업 전·후 드롭존을 분리한다. 고객 라이트박스는 현재 슬라이드의 미디어 단계에서 파생한 배지를 슬라이드 헤더로 렌더링한다.

## Technical Context

- Next.js 16.2 App Router, React 19, TypeScript strict, Tailwind CSS 4
- React Hook Form, Zod, yet-another-react-lightbox 3.29
- Vitest/Testing Library 및 Playwright
- Supabase repository 경계 유지, Storage 비활성 플래그 유지

## Constitution Check

- Supabase/RLS와 Storage 비활성 정책을 변경하지 않는다.
- 각 동작은 실패 테스트를 먼저 확인한다.
- 390px·1440px 및 키보드 접근성을 유지한다.
- `tasks.md` 확정 후 구현 중 계획 문서를 변경하지 않는다.

## Project Structure

- 관리자 진입: `components/admin/`, `app/admin/(protected)/portfolio/`, `features/portfolio/ui/admin-case-list.tsx`
- 업로드 단계: `features/uploads/`, `features/portfolio/ui/admin-publishing-workspace.tsx`
- 고객 확대보기: `components/portfolio/case-lightbox.tsx`, `components/portfolio/gallery-grid.tsx`
- 검증: `tests/component/`, `tests/e2e/`

## Design Decisions

1. 별도 생성 경로는 보존하되 사례 관리 화면의 버튼으로만 주 진입을 제공한다.
2. `UploadPanel`에 필수 `stage: "before" | "after"`를 전달하고 안내 문구와 접근성 라벨을 단계별로 생성한다.
3. 업로드 큐와 사례당 제한은 두 패널이 저장소의 실제 미디어를 기준으로 검증한다.
4. 빠른 상세보기는 대표 미디어의 단계로 배지를 표시하고, 라이트박스는 `render.slideHeader`에서 현재 슬라이드의 단계로 배지를 표시한다.

## Verification Strategy

- 컴포넌트: 관리자 메뉴/목록 버튼, 두 드롭존, 단계 저장, 빠른 상세보기·라이트박스 배지
- E2E: 사례 관리에서 생성·편집 진입, 전후 드롭존 표시, 고객 확대 배지
- 전체: `pnpm test`, `pnpm lint`, `pnpm typecheck`, 관련 Playwright, `pnpm build`

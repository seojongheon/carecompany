# Implementation Plan: 관리자 이미지 업로드

**Branch**: `main` | **Date**: 2026-07-23 | **Spec**: [spec.md](spec.md)

## Summary

공통 드래그앤드롭 업로드 UI를 사례와 랜딩 히어로에 적용한다. 현재 Storage가 비활성인 점을 명확히 드러내며, 콘텐츠 모델과 랜딩 렌더러는 나중에 공개 URL이 저장되면 즉시 사용할 수 있게 한다.

## Technical Context

- Next.js 16, React 19, TypeScript strict, Vitest, Playwright
- Supabase Storage는 `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED` 플래그 아래 준비 상태
- 기존 `validateFileSelection`, `SessionPreviewManager`, `SiteContentRepository` 재사용

## Constitution Check

- 실제 객체 저장은 활성화 플래그와 검토된 Storage 정책 없이는 수행하지 않는다.
- 테스트 우선으로 파일 드롭, 권장 크기, 랜딩 반영 계약을 추가한다.
- 공개 URL만 랜딩에 노출하고 원본 경로를 노출하지 않는다.

## Project Structure

```text
features/uploads/
├── model/image-upload-guidance.ts
└── ui/image-dropzone.tsx
features/site-content/
├── model/types.ts
└── ui/landing-hero-image-manager.tsx
components/site/home-sections.tsx
tests/component/
└── image-upload-flows.test.tsx
```

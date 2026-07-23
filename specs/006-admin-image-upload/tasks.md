# Tasks: 관리자 이미지 업로드

## Phase 1: 공통 이미지 입력 기반

- [ ] T001 `tests/component/image-upload-flows.test.tsx`에 드롭·파일 선택·권장 크기·비율 경고 실패 테스트 작성
- [ ] T002 `features/uploads/model/image-upload-guidance.ts`에 사례·히어로 권장 크기 계약 추가
- [ ] T003 `features/uploads/ui/image-dropzone.tsx`에 접근 가능한 클릭·드롭 입력 구현

## Phase 2: 사례 사진 업로드

- [ ] T004 [US1] `features/uploads/ui/upload-panel.tsx`에 공통 드롭존과 Storage 준비 상태 연결
- [ ] T005 [US1] 사례 파일 선택·드롭·제한 회귀 테스트 통과 확인

## Phase 3: 랜딩 히어로 업로드

- [ ] T006 [US2] `features/site-content/model/types.ts`와 시드에 선택적 히어로 URL·경로 필드 추가
- [ ] T007 [US2] `features/site-content/ui/landing-hero-image-manager.tsx` 구현 및 홈페이지 관리 화면 연결
- [ ] T008 [US2] `components/site/home-sections.tsx`에서 공개 URL이 있을 때 업로드 이미지를 사용하도록 연결
- [ ] T009 [US2] 히어로 업로드·대체 텍스트·목업 폴백 회귀 테스트 통과 확인

## Phase 4: 검증

- [ ] T010 `pnpm lint`, `pnpm typecheck`, `pnpm test`, 인증 Playwright, `pnpm build` 실행
- [ ] T011 드래그앤드롭 관리자 화면과 공개 랜딩을 브라우저에서 확인

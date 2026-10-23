# 실행 작업 계약

사용자 요청: 기존 기능 누락 점검 → Figma 방식으로 보완 → 실제 관리자 UI 구현. 기존009 계약은 보존한다.

- [x] T001 기존 기능/Figma 대응표를 `docs/design/admin-figma/03-implementation-coverage.md`에 작성한다. 모든9개 메뉴, 필터·상세 필드·복구·역할/캠페인 기록을 포함한다. 검증: 코드와 디자인 노드 대조.
- [x] T002 [US1] `components/admin/`, `lib/admin/navigation.ts`, `app/admin/(protected)/layout.tsx`, `app/admin/admin.css`의 공통 탐색·헤더·페이지·카드·탭 및 대시보드를 구현한다. 선행T001. 검증: 역할별 메뉴와 모바일 닫기 테스트, 대시보드 실제 링크/데이터 테스트.
- [x] T003 [US2] `features/portfolio/ui/`, `app/admin/(protected)/portfolio/`의 목록/편집/게시 영역을 Figma로 재구성한다. 선행T001. 검증: 기존 사례 회귀 및 섹션 이동 시 입력 유지, 필수 검토·복원 접근.
- [x] T004 [US3] `features/site-content/ui/`의 문서/서비스/가격/공지 화면을 필드 누락 없이 그룹화한다. 선행T001. 검증: 모든 문서 필드 보존, 탭과 초안 이탈 보호, 저장·게시·비교·복원 테스트.
- [x] T005 [US2] `app/admin/(protected)/inquiries/`, `features/inquiries/ui/`를 목록 탭/검색/필터/상세 보조패널 구조로 구현한다. 선행T002. 검증: 모든 필터와 문의 처리 회귀.
- [x] T006 [US4] `features/media/`, `features/admin/users/`, `features/notifications/ui/`, `app/admin/(protected)/{users,settings,analytics}/`를 통일하고 역할 기록·캠페인을 보완한다. 선행T002. 검증: 권한 보호, 미연결, 사용중 삭제 차단, 기존 정보 접근.
- [x] T007 연결된DB 이관/권한/함수/인덱스를 확인하고 `docs/verification/supabase-2026-10-23.md`에 기록한다. 결함은 테스트 후 비파괴 이관으로 수정한다. 선행없음. 검증: migration ledger, isolatedDB/실제 read-only checks.
- [x] T008 전체 테스트·타입·린트·빌드·Playwright·반응형 시각 검증 및 독립 코드리뷰를 수행하고 `docs/verification/admin-figma-refresh.md`에 기록한다. 선행T002–T007. 주요 결함 해결 후 완료 보고.

T003/T004/T007은 파일 소유권을 분리해 독립 실행할 수 있다. 검증된 기존 동작은 테스트를 유지하고, 새 행동은 실패 테스트→구현→통과로 진행한다. 시각적 수치만 확인하는 구현 복제 테스트는 추가하지 않는다.

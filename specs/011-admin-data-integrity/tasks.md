# Tasks: 관리자 데이터 정합성 보완

## Phase 1: 확인
- [x] T001 `.cache/supabase-audit/`의 읽기 전용 검사로 실제 스키마·문서·사례·미디어·회원 연결과 최초 가격 이관 경위를 확인한다. 결과는 최종 `docs/verification/admin-data-integrity-2026-10-23.md`에 비식별 요약한다.

## Phase 2: 검증 기반
- [x] T002 `scripts/verify-data-integrity-db.mjs`에 이전 문서 fixture 및 기존 필드/게시본/수동 편집/중복 적용/CAS/가격 항목 식별 보존 테스트를 작성하고 수정 전 실패를 확인한다. `package.json` DB 검사에 연결한다.

## Phase 3: US1 누락 복구
- [x] T003 [US1] `supabase/migrations/20261023000200_content_data_integrity.sql`에 settings 누락 키 보충과 조건부 최초 pricing 초안 복구를 구현한다. T002 선행. 기존값/다른문서/공개가격 보존 및 revision 증가 검증.

## Phase 4: US2 처리 구조
- [x] T004 [US2] 같은 migration의 `publish_content_document`에서 legacy price ID를 문서와 투영에 일관되게 정규화한다. services.slug의 부정확한 기본값도 제거한다. T002 선행. 반복게시/복원/오류 원자성/권한/CAS 테스트.

## Phase 5: 검증 및 적용
- [x] T005 전체 DB 회귀와 실제 콘텐츠 복제본 이관 연습, 독립 코드 리뷰를 수행한다. T003/T004 선행. 운영 쓰기 이전 결함 모두 해소.
- [x] T006 연결 DB에서 dry run→변경 전 백업/지문→새 migration만 적용→정합성/보존/역할 검사 순서로 실행한다. 시드/초기화/정책게시/스토리지 변경 금지. T005 선행.
- [x] T007 `docs/verification/admin-data-integrity-2026-10-23.md`에 결과와 미입력 운영정보/정책 상태를 기록하고 검증된 변경을 기존 PR에 반영한다. T006 선행.

## Dependencies / Execution
T001→T002→T003/T004→T005→T006→T007. T003/T004가 하나의 migration을 공유하므로 구현은 순차 진행한다. 외부 읽기/코드 리뷰는 변경하지 않는 별도 작업으로 병행 가능하다. 별도 신규 제품 기능은 없으며 보완 계획 전체를 이번 작업에서 완료한다.

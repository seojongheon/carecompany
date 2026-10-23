# 관리자 운영 시스템 009 배포 절차

이 변경은 기존 공개 사례와 사이트 콘텐츠를 보존하며 운영 구조를 확장한다. Supabase 데이터 초기화 또는 seed 재적용은 하지 않는다.

## 대상과 변경 목록

- 기존 연결 Supabase: `psrcgicsqjgkshehasvv`
- 기존 연결 Vercel: `carecompany-xiwj`
- 신규 migration: `20261019000100` 관리자·감사, `00200` 콘텐츠·미디어, `00300` 사례 revision, `00400` 문의·알림, `00500` 방문 통계, `00600` RPC 충돌 오류 코드 보정.
- 기존 최고 관리자 계정은 유지한다. 웹 UI에서는 최고 관리자 승격·강등을 지원하지 않는다.
- 서비스 네 종류와 사례 ID·slug·사진 경로를 보존한다.
- 사용자는 별도 스테이징 대신 연결된 프로젝트 사용을 요청했다. 테스트는 명시된 연결과 고유 접두사 자료에 한정한다.

## 현재 진행 상태 — 2026-10-19

- 준비 검증 통과: 59개 파일·248개 테스트(16:45:47 시작 실행), 최종 typecheck·전체 lint·production build·diff 검사 통과. 빌드는 샌드박스 포트 제한 뒤 권한 확장 재실행에서 정적 페이지 35개 생성까지 완료했다.
- 격리 DB 검증 통과: migration 16개, DB 행동 검증 93개, 콘텐츠·미디어 SQL 회귀.
- 연결 DB 사전 검증 통과: dry run에 신규 migration 5개만 표시. 트랜잭션 이관 시험에서 기존 사례 2개·사진 20개·게시문구를 보존하고 ROLLBACK 완료.
- 실제 연결 DB 적용 완료: 최초 신규 5개와 006 보정까지 원격 migration 총 16개. 기존 사례 2개·사진 20개와 모든 bucket의 private 설정 보존.
- 최종 Production 최고 관리자 인증 읽기 검사 완료: 7개 화면 × 1440/390 크기, 총 14개 통과(exit 0). networkidle 이후 오류 alert가 없고, 데스크톱 대시보드 스크린샷 육안 검토도 완료했다. 비밀번호 자격증명이 필요한 최고 관리자 E2E 시나리오 2개의 건너뜀과 구분해 기록한다.
- 최종 인증 E2E 완료: 26개 시나리오 중 24개 통과·2개 건너뜀(1.3분). 실제 업로드·게시·기존 공개본 보존·복원·사진 69개 한도·충돌을 두 화면 크기에서 검증했다. 문의 관련 6개 시나리오는 정책 미게시 차단 분기로, 성공 접수 전체 흐름의 검증이 아니다.
- Vercel production·preview에 서버 전용 `SUPABASE_SECRET_KEY`, `CRON_SECRET` 등록 완료. 비밀값은 문서나 Git에 저장하지 않는다.
- 테스트 자료 정리 완료: cleanup-e2e.mjs로 남은 테스트 사례 1개를 삭제함으로 이동했고, 미정리 테스트 공지 0개를 확인했다. 테스트 계정 3개는 customer·inactive로 처리했다. 기존 사례 2개의 slug/status와 사진 20개의 Storage 경로를 보존했으며 active master 1명, public bucket 0개, migration 16개를 확인했다.
- Production 배포 `dpl_GptyQ7kX8K55G4quVTE8pT9SQ9fx` READY. [운영 주소](https://carecompany-xiwj.vercel.app)가 [새 배포 URL](https://carecompany-xiwj-ebywdrhrp-sjh47921-2226s-projects.vercel.app)의 ID로 매핑된 것을 확인했다.
- 운영 주소 원격 검사 17개 통과: 공개 경로 12개 200, 비로그인 관리자 로그인 이동, maintenance 무인증 401·인증 200, 동의 없는 분석 400, 유효하지 않은 문의 400.
- 성공 문의 접수 E2E는 운영 설정 후 추가 확인 대상이다. 현재 미게시인 실제 정책·동의 문구를 최고 관리자가 검토·게시한 뒤 접수부터 회원 조회·관리자 처리까지 확인한다. 테스트 목적으로 공용 정책을 임의 게시하지 않았다.

## 적용 전

1. 전체 단위·컴포넌트, 타입, lint, build와 `pnpm test:db:operations`를 통과시킨다.
2. 연결된 migration 목록을 읽고 `supabase db push --dry-run --linked`에서 아직 적용하지 않은 검증된 migration만 표시되는지 확인한다. 이번 반영은 최초 001–005 적용 후 006 보정을 추가 적용했으며 총 16개 상태를 확인했다.
3. 영향을 받는 테이블·기존 함수·정책을 로컬 비공개 백업으로 보관한다. 백업에는 운영 데이터가 있으므로 Git에 추가하지 않는다.
4. 실제 연결에서 트랜잭션 안에 이관을 적용하고 기존 사례·사진·게시 필드가 유지되는지 검사한 후 ROLLBACK한다. 이 검사에서는 Storage HTTP 파일을 수정하지 않는다.
5. Vercel의 서버 전용 `SUPABASE_SECRET_KEY`, `CRON_SECRET`을 설정한다. `NEXT_PUBLIC_` 접두사를 사용하지 않는다. 2026-10-19 production·preview 등록을 완료했다. 재배포 시 대상 환경의 등록 상태를 확인한다.
6. 코드와 migration을 한 배포로 관리한다. 새 migration은 과거 전체 사이트 게시/사례 직접 수정 RPC를 차단하므로 구 버전 관리자 앱만 되돌리는 rollback은 안전하지 않다.

## 적용 및 확인

- 검증된 신규 migration만 CLI로 적용한다. `db reset`, `--include-seed`는 사용하지 않는다.
- 새 버전 앱에서 `/admin`의 실제 집계, 사례 초안·게시, 문서별 게시, 회원·권한 경계를 확인한다.
- `playwright.admin.config.ts`는 `E2E_TARGET_ENV=linked`, `E2E_ALLOW_LINKED_WRITES=true` 또는 별도 staging을 명시해야 실행한다. 테스트용 계정과 자료만 사용한다.
- 사례 사진 테스트는 `E2E_CASE_STORAGE_READY=true`일 때만 실행한다. 저장소 전체를 public으로 전환하지 않는다.
- 최고 관리자가 실제 개인정보 처리 내용·문의 동의 문구를 검토하고 정책을 게시하기 전에는 문의 접수를 차단한다. 검증을 위해 가짜 정책을 게시하지 않는다.
- 외부 이메일·문자·카카오 공급자는 미연결 상태를 유지한다. 실제 발송하지 않는다.
- 분석은 방문자의 선택 동의 이후 시작한다. 캠페인 분류는 `naver-search`, `google-search`, `kakao-channel`, `instagram`, `offline`만 허용한다.
- `/api/internal/maintenance`는 Bearer CRON_SECRET으로 보호된다. 매일 한국 시간03시에90일이 지난 분석 이벤트와 참조 없는 문의 임시 업로드를 정리한다.

## 실패 시

배포 전 이관 시험은 전체 ROLLBACK한다. 실제 migration 후에는 기능 수정 배포를 우선한다. 데이터 복구가 필요하면 관리자 쓰기를 중지하고 검증한 백업과 Supabase 복구 절차로 진행한다. 이전 앱만 재배포하거나 새 테이블을 임의로 삭제하지 않는다. 임시 테스트 자료는 사례 삭제함·문의 스팸·공지 숨김으로 정리하며 기존 운영 자료는 건드리지 않는다.

문의 사진은 선택 원본5장·장당10MiB를 검사하고 접수용 WebP로 최적화한다. 사진당600KiB, 전체 요청3.5MiB 한도로 [Vercel 요청 본문 제한](https://vercel.com/docs/functions/limitations)에 맞춘다. 서버에서도 형식·실제 이미지 내용·크기를 재검증한다.

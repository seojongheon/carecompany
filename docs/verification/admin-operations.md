# 관리자 운영 시스템 검증 기록

## 범위

9개 관리자 메뉴, 독립 문서 게시, 사례 revision, 문의·회원 조회, 비공개 미디어, 역할·정지 상태, 화면 내 알림, 동의 기반 분석을 구현했다. 기존 로그인 성공 후 `/` 이동은 유지했다. 외부 알림 실발송과 결제·예약·채팅은 범위 밖이다.

## 검증 단계

2026-10-19 현재 실제 DB 적용, 인증 E2E, 테스트 자료 정리, Production READY, 운영 주소 검사 17개와 최종 Production 최고 관리자 화면 검사 14개를 확인했다. 성공 문의 접수 E2E는 실제 정책 게시 후 추가 확인이 필요하다.

| 검사 | 근거 및 현재 상태 |
|---|---|
| 단위·컴포넌트 | 2026-10-19 16:45:47 시작 실행: 전체 59개 파일, 248개 테스트 통과 |
| 타입·린트·빌드 | 최종 typecheck, 전체 lint, git diff --check 통과. production build는 샌드박스 포트 제한으로 첫 실행이 중단됐으나 권한 확장 재실행에서 compile·typecheck·정적 페이지 35개 생성 모두 통과 |
| PostgreSQL | 전체 16개 migration(기존 10개 + 신규 6개) 격리 적용, DB 행동 검증 93개 및 콘텐츠/미디어 SQL 회귀 통과 |
| 실제 연결 dry run | 최초 신규 5개만 표시, seed 없음. 이후 006 충돌 오류 코드 보정 추가 |
| 실제 연결 이관 시험 | BEGIN 내부 적용 후 ROLLBACK 성공. 기존 사례 2개·사진 20개·게시문구 보존 확인. 실제 적용 완료와 구분 |
| 비로그인 브라우저 | 1440×900/390×844 로그인 경계, 동의 수집, 문의 실패 입력 보존·접근성. 일부 API를 fixture로 대체하는 smoke이며 실제 저장 검증과 구분 |
| 최종 Production 최고 관리자 읽기 | 실제 인증으로 7개 화면 × 1440/390 크기, 총 14개 검사 통과(exit 0). networkidle까지 기다린 뒤 오류 alert 없음 확인, 데스크톱 대시보드 스크린샷 육안 검토 완료 |
| 인증 E2E | 실제 연결에서 26개 시나리오 중 24개 통과·2개 건너뜀, 1.3분. 비밀번호 자격증명이 필요한 최고 관리자 시나리오 2개는 건너뛰었으며, 별도 실제 최고 관리자 읽기 검사 14개를 기록 |
| 인증 E2E 범위 | 실제 업로드·게시·기존 공개본 보존·복원·사진 69개 한도·오래된 revision 충돌을 데스크톱/모바일에서 통과. 문의 관련 6개 시나리오는 정책 미게시 차단 분기이며, 성공 접수 전체 흐름을 검증했다는 뜻이 아님 |
| 배포 환경변수 | Vercel production·preview에 서버 전용 SUPABASE_SECRET_KEY 및 CRON_SECRET 등록 성공. 비밀값은 기록하지 않음 |
| 실제 DB 적용 | 최초 신규 5개 및 006 보정 적용 완료, 원격 migration 총 16개. 기존 사례 2개·사진 20개 보존, 모든 Storage bucket private 유지 |
| 테스트 자료 정리 | cleanup-e2e.mjs 완료. 남은 테스트 사례 1개는 삭제함으로 이동, 미정리 테스트 공지 0개, 테스트 계정 3개는 customer·inactive 처리 |
| 정리 후 보존 검사 | 기존 사례 2개의 slug/status, 사진 20개의 Storage 경로 보존. active master 1명, public bucket 0개, migration 16개 확인 |
| 배포 | Production `dpl_GptyQ7kX8K55G4quVTE8pT9SQ9fx` READY. [운영 주소](https://carecompany-xiwj.vercel.app)가 [새 배포](https://carecompany-xiwj-ebywdrhrp-sjh47921-2226s-projects.vercel.app) ID를 가리키는 것을 확인 |
| 운영 주소 검사 | 17개 통과: 공개 경로 12개 HTTP 200, 비로그인 관리자 접근의 로그인 이동, maintenance 무인증 401·인증 200, 분석 동의 false 요청 400, 유효하지 않은 문의 요청 400 |

## 발견하여 수정한 주요 결함

- 지연 저장 중 사진·영상·태그·검토 체크가 앞선 변경을 덮어쓰던 문제: 실행 시점 최신 상태에 함수형 변경 적용.
- 비공개·삭제함 복원 후 초안이 없어 재게시할 수 없던 문제: 기존 초안 보존 또는 공개본에서 초안 생성.
- 직접 콘텐츠 RPC가 잘못된 중첩 JSON 형식을 허용하던 문제: DB에서도 필드·배열 자료형 검증.
- 문서 저장 중 추가 입력이 응답에 덮이던 문제: 처리 중 편집 잠금, 실패 후 입력 보존.
- 기본값이 있는 문서 textarea의 정확한 라벨 검색이 실패하던 문제: 본문·문자열 배열 입력에 명시적 aria-label 적용. Chromium 재현과 컴포넌트 회귀 확인.
- 사례 충돌 복구 뒤 자동저장이 멈추거나 느린 응답이 원래값으로 되돌린 입력을 덮던 문제: 복구 상태 해제와 입력 유지, 실제 갱신 snapshot으로 회귀 검증.
- 최신 버전 로드 실패 뒤 재시도하면 오래된 값을 최신 비교값으로 쓰던 문제: reload 성공 여부 확인 후 비교 생성. 기존 실패 재현 테스트 통과 확인.
- revision 충돌이 반복 재시도로 처리되던 문제: 006에서 대상 RPC 6개의 사용자 정의 SQLSTATE를 40001에서 P0001로 보정.
- 수동 문의 재시도 중복: 요청 ID·입력 지문을 DB 원자적으로 검증.
- 원본 사진 일괄 요청이 배포 크기 한도를 넘는 문제: 접수용 최적화 후 서버 재검증. 실제 Chromium에서6.87MB사진5장 요청을2.93MB로 확인.
- 정책 게시와 문의 동의 문구가 분리돼 있던 문제: 게시 정책을 실제 폼에 표시하고 미게시 접수 차단.
- 정지·강등된 알림 수신자 때문에 설정 저장이 막히던 문제: 제거 가능한 기존 수신자 표시.
- 임의 campaign 문자열로 전화번호가 들어갈 수 있던 문제: 명시적 분류 목록만 수집.
- 일반 사례 목록에 삭제함이 섞이던 문제: 삭제함 분리, 변경 초안 필터는 게시 중 사례에 한정.

## 재현 명령

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:db:operations
node --max-http-header-size=65536 node_modules/next/dist/bin/next start -p 3100
node node_modules/@playwright/test/cli.js test --config=playwright.smoke.config.ts
pnpm test:e2e:admin
```

PGlite 검증의 Auth/Storage 스키마는 테스트 fixture다. 실제 Supabase HTTP 인증·업로드를 대체하지 않는다. 운영 연결의 데이터 이관 시험과 인증 브라우저 결과를 별도로 기록한다. 자세한 절차는 [배포 절차](../operations/admin-operations-release.md), [인증 E2E](admin-staging-e2e.md)를 따른다.

## 운영 설정 후 추가 확인

- 현재 문의 정책은 미게시 상태다. 최고 관리자가 실제 개인정보 처리 내용과 동의 문구를 검토·게시한 뒤, 성공 접수·접수번호·회원 내 문의·담당자 처리까지 실제 문의 E2E를 추가 확인해야 한다. 이번 검증을 위해 공용 정책을 임의 게시하지 않았다.

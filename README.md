# 위생의 기술 포트폴리오

천안·아산 청소 포트폴리오의 고객용 웹과 관리자 목업입니다. 제품 요구사항은
`hygiene-technology-portfolio-prd.md`가 최종 기준이며, `design/`은 충돌하지 않는
시각 언어만 참고합니다.

## 현재 범위

- 프런트엔드 목업만 구현합니다.
- `/admin`은 인증 없이 직접 접근합니다.
- 사례 JSON은 같은 브라우저의 `localStorage`에 보존합니다.
- 실제 선택 사진은 현재 탭의 미리보기로만 사용하며 새로고침 후 목업 이미지로 복원합니다.
- Supabase, 인증, DB, RLS, 원격 Storage, TUS, 서버 검증, 분석, 배포는 연결하지 않습니다.

미완료 연동 항목은 [`docs/project/deferred-backend-integration.md`](docs/project/deferred-backend-integration.md)에서 추적합니다. 이 앱은 시연용이며 현재 상태로 실제 고객 정보나 현장 사진을 입력하거나 배포하면 안 됩니다.

## 주요 경로

| 경로 | 용도 |
|---|---|
| `/` | 고객용 홈 |
| `/services`, `/services/[service]` | 4개 서비스와 서비스별 공개 사례 |
| `/portfolio`, `/portfolio/[slug]` | 필터 가능한 공개 사례 목록과 상세/빠른 보기 |
| `/pricing`, `/process`, `/about`, `/privacy` | 가격·작업 과정·소개·개인정보 안내 |
| `/admin` | 인증 없는 목업 관리자 대시보드 |
| `/admin/portfolio` | 사례 목록·필터·초기화 |
| `/admin/portfolio/new` | 비공개 초안 생성 |
| `/admin/portfolio/[id]/edit` | 메타데이터·사진·영상·공개 상태 편집 |

## 브라우저 목업 저장소

UI는 `PortfolioRepository` 계약에만 의존하고 현재 어댑터는
`features/portfolio/repository/local-storage-portfolio-repository.ts`입니다. 텍스트와
목업 분류 정보는 `hygiene-technology:portfolio:v1` 키에 JSON으로 저장됩니다. 공개
셀렉터는 공개 상태이며 검토 완료된 미디어만 반환하지만, 이는 보안 경계가 아닙니다.

목업 데이터를 초기 상태로 되돌리려면 `/admin/portfolio`의 **목업 데이터 초기화**를
사용합니다. 브라우저 개발자 도구에서 위 키를 지운 뒤 새로고침해도 초기 시드가
복원됩니다. 손상된 JSON은 별도 복구 키로 백업한 뒤 안전한 시드로 복구합니다.

선택한 실제 이미지의 object URL은 탭 세션에서만 유효합니다. 새로고침하면 파일
바이너리는 복원하지 않고 안전한 목업 이미지와 저장된 메타데이터를 표시합니다.

## 로컬 실행

```bash
pnpm install
pnpm dev
```

Node.js 24 LTS와 pnpm을 기준으로 합니다. 개발 서버는 `http://localhost:3000`에서
실행됩니다.

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Spec Kit은 명세·계획·작업 계약을 소유하고, Superpowers는 `tasks.md`를 TDD 방식으로
구현·검토·검증합니다. `speckit-implement`는 사용하지 않습니다.

검증 기록과 화면 검토 결과는 각각
[`frontend-final-verification.md`](docs/verification/frontend-final-verification.md),
[`frontend-visual-review.md`](docs/verification/frontend-visual-review.md)에 있습니다.

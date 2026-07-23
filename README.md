# 위생의 기술 포트폴리오

천안·아산 청소 포트폴리오의 고객용 웹과 관리자 CMS입니다. 제품 요구사항은 `hygiene-technology-portfolio-prd.md`가 최종 기준입니다.

## 현재 연동 상태

- Supabase Auth 이메일/비밀번호 가입·로그인·로그아웃·재설정 세션을 사용합니다.
- 공개 가입자는 데이터베이스 트리거에서 항상 `customer`로 생성됩니다.
- `/admin` 보호 경로는 서버에서 현재 사용자와 `profiles.role`, `is_active`를 다시 확인합니다.
- 서비스, 사례, 미디어 메타데이터, 영상, 태그, 사이트 콘텐츠, 가격과 권한 감사 기록은 Supabase PostgreSQL/RLS를 사용합니다.
- 홈페이지와 사례 관리자가 저장·게시한 결과는 Supabase를 거쳐 공개 화면에 반영됩니다.
- 관리자 회원가입은 없으며 초기 슈퍼 관리자도 생성하지 않았습니다. 별도 운영 절차는 `supabase/README.md`에만 준비되어 있습니다.
- Supabase Storage는 의도적으로 비활성입니다. 업로드 UI는 연결 대기를 표시하며 원격 업로드를 시도하지 않습니다.

## 환경 변수

`.env.example`을 기준으로 로컬 `.env.local`을 구성합니다. 실제 키와 DB 비밀번호는 Git에 포함하지 않습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false
SUPABASE_DATABASE_PASSWORD=...
```

`SUPABASE_DATABASE_PASSWORD`는 CLI 실행 전용입니다. 브라우저 코드와 `NEXT_PUBLIC_` 변수에 넣지 않습니다.

## 주요 경로

| 경로 | 용도 |
|---|---|
| `/`, `/services/[service]`, `/pricing` | 게시된 홈페이지·서비스·가격 |
| `/portfolio`, `/portfolio/[slug]` | RLS로 제한된 게시 사례 목록·상세 |
| `/login`, `/signup`, `/forgot-password` | 고객 인증 |
| `/admin/login` | 승인된 관리자 로그인 |
| `/admin` | 서버 보호 관리자 대시보드 |
| `/admin/portfolio` | 사례 생성·편집·게시·비공개·소프트 삭제 |
| `/admin/site` | 홈페이지 초안·가격·게시 버전 관리 |
| `/admin/users` | 슈퍼 관리자 전용 역할·활성 상태 관리 |

## 데이터베이스 작업

마이그레이션은 `supabase/migrations/`이 유일한 스키마 기준입니다. 연결된 원격 프로젝트에는 reset/seed를 실행하지 않습니다.

```bash
pnpm supabase migration list --linked
pnpm supabase db push --linked --dry-run
pnpm supabase db push --linked
pnpm supabase:types
pnpm supabase:db:lint
pnpm supabase:verify:public
```

로컬 pgTAP은 Docker Desktop이 실행 중일 때 `pnpm supabase:test:db`로 검증합니다. Storage 활성화 SQL은 자동 마이그레이션 경로가 아닌 `supabase/storage/enable-storage.sql`에 있으며 별도 승인 전 실행하지 않습니다.

## 로컬 실행과 검증

```bash
pnpm install
pnpm dev

pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

운영 전에는 Auth redirect URL, SMTP, CAPTCHA/rate limit, 초기 슈퍼 관리자, Storage 플랜과 이미지 처리, 실데이터, 배포·관측 설정을 별도로 승인해야 합니다. 남은 항목은 `docs/project/deferred-backend-integration.md`에서 추적합니다.

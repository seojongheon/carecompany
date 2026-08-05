# 위생의 기술 포트폴리오

천안·아산 청소 포트폴리오의 고객용 웹과 관리자 CMS입니다. 제품 요구사항은 `hygiene-technology-portfolio-prd.md`가 최종 기준입니다.

## 현재 연동 상태

- Supabase Auth 이메일/비밀번호 가입·로그인·로그아웃·재설정 세션을 사용합니다.
- 공개 가입자는 데이터베이스 트리거에서 항상 `customer`로 생성됩니다.
- `/admin` 보호 경로는 서버에서 현재 사용자와 `profiles.role`, `is_active`를 다시 확인합니다.
- 서비스, 사례, 미디어 메타데이터, 영상, 태그, 사이트 콘텐츠, 가격과 권한 감사 기록은 Supabase PostgreSQL/RLS를 사용합니다.
- 홈페이지와 사례 관리자가 저장·게시한 결과는 Supabase를 거쳐 공개 화면에 반영됩니다.
- 관리자 회원가입은 없으며 초기 슈퍼 관리자도 생성하지 않았습니다. 별도 운영 절차는 `supabase/README.md`에만 준비되어 있습니다.
- Supabase Storage 버킷·RLS·실제 사례/랜딩 이미지 업로드 경로가 준비되어 있습니다. 운영 환경에서는 마이그레이션 검증 후 기능 플래그로 활성화합니다.

## 환경 변수

`.env.example`을 기준으로 로컬 `.env.local`을 구성합니다. 실제 키는 Git에 포함하지 않습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false
```

DB 비밀번호는 앱 환경변수가 아닙니다. `supabase link`의 보안 프롬프트와 OS 네이티브 자격 증명 저장소를 기본으로 사용합니다. 비대화형 CLI/CI가 꼭 필요할 때의 공식 변수명은 `SUPABASE_DB_PASSWORD`이며, CI 비밀 저장소에만 보관하고 브라우저·Vercel·`NEXT_PUBLIC_` 변수에는 넣지 않습니다.
`NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED`는 안전한 로컬 기본값을 `false`로 유지하고, Storage 마이그레이션과 정책 검증이 끝난 Vercel Production에서만 `true`로 설정합니다.

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
supabase start
supabase db reset
supabase test db

supabase login
supabase link --project-ref <PROJECT_REF>
supabase migration list --linked
supabase db push --dry-run
supabase db push
pnpm supabase:verify:public
```

로컬 pgTAP은 Docker Desktop과 Supabase CLI가 준비되어 있을 때 실행합니다. Storage 활성화 기준은 `supabase/migrations/20260805000100_storage_production_readiness.sql`이며, `supabase/storage/enable-storage.sql`은 실행하지 않는 과거 검토 자료입니다.

## Vercel Storage 활성화

1. Vercel에는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED`만 등록합니다. `SUPABASE_DB_PASSWORD`와 service-role 키는 등록하지 않습니다.
2. Supabase 마이그레이션 dry-run과 DB 정책 테스트를 먼저 완료합니다.
3. Vercel Production의 `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED`를 `true`로 바꾸고 재배포합니다.
4. 관리자 사례 이미지와 랜딩 대표 이미지의 업로드·게시·삭제, 비공개 접근 차단을 운영 URL에서 확인합니다.
5. 문제가 생기면 플래그를 `false`로 되돌려 재배포합니다. 버킷이나 기존 객체는 삭제하지 않습니다.

상세 순서는 `supabase/storage/README.md`를 따릅니다.

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

운영 전에는 Auth redirect URL, SMTP, CAPTCHA/rate limit, 초기 슈퍼 관리자, 실제 Supabase 마이그레이션 적용, 실데이터, 배포·관측 설정을 별도로 승인해야 합니다. 남은 항목은 `docs/project/deferred-backend-integration.md`에서 추적합니다.

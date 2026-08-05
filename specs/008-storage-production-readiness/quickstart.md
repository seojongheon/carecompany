# Quickstart: 운영 이미지 Storage 검증

## Prerequisites

- Supabase CLI가 대상 프로젝트에 연결되어 있다.
- 활성 관리자와 일반 고객 테스트 계정이 준비되어 있다.
- 로컬 비밀값은 `.env.local`에만 저장되어 있다.
- 활성화 전 `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=false`를 유지한다.

## Automated verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Docker 기반 로컬 Supabase가 준비된 경우 데이터베이스 정책 테스트도 실행한다.

```bash
pnpm supabase:test:db
```

## Deployment sequence

1. 새 마이그레이션을 로컬 또는 별도 테스트 프로젝트에 적용한다.
2. 원본·비공개 검토본·초안 랜딩 이미지의 익명 접근 거부를 확인한다.
3. 관리자 업로드, 게시 후 공개 조회, 개별 삭제와 실패 재시도를 확인한다.
4. 연결 프로젝트에서 마이그레이션 dry-run을 검토한 뒤 적용한다.
5. Vercel Production 환경에서 `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true`를 설정하고 재배포한다.
6. 운영 URL에서 사례 업로드·공개·비공개와 랜딩 이미지 게시를 다시 확인한다.

## Rollback

Vercel의 `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED`를 `false`로 되돌리고 재배포한다. 버킷이나 객체를 삭제하지 않는다. 이미 발급된 서명 URL은 짧은 만료 시간까지 유효할 수 있다.

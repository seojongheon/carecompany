# Validation
1. `pnpm test:db:operations`: 기존 권한·업무 검증 및 실제 엔진에서 데이터 복구/가격 게시 회귀 검증.
2. `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.
3. 연결 DB read-only 검사: 필수 문서, JSON 검증, 참조/투영/권한, migration ledger.
4. 운영 콘텐츠 복제본에 이관을 연습하고 해당 문서의 기존 필드 보존과 null 공개본·수동 편집 보호를 검증한다.
5. `supabase db push --linked --dry-run`으로 새 migration만 확인한 뒤 적용한다. 시드/roles 변경 금지.
6. 적용 후 settings 원본 스키마 검증, 가격 초안4/공개4 일치, 나머지 테이블 지문 보존, 버킷 구성 보존을 확인한다.

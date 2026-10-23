# Implementation Plan: 관리자 데이터 정합성 보완

## Summary / Technical Context
PostgreSQL/Supabase, 기존 Next.js16/TypeScript 및 PGlite 검증 기반을 유지한다. 새 migration `20261023000200_content_data_integrity.sql`만 운영에 적용한다. 기존 함수 시그니처·RLS·grants와 고객 데이터 계약을 유지한다.

## Constitution Check
기존 공개본·개인정보·Storage 비공개 설정 보존, 새 실제 정보 추측 금지, 테스트 우선, 연결 프로젝트 dry run, 기존 승인 문서 보존. 요구 변경이 없는 데이터 복구이므로 별도 기획 승인 질문은 필요하지 않다. 사용자에게 보완 범위를 안내했다.

## Research / Decisions
근거는 `research.md`. settings에는 4개 구형 키만 있으며 화면에서 나머지를 임시 보충한다. pricing은 초기 이관 revision2, updated_by/published_by=null, 감사 기록 없음, 구형 site_content에 priceItems 키 없음, draft.items=[], published.items=4다. 현재 잘못된 참조는 없으나 가격 게시 함수가 비UUID ID를 테이블에만 변환하는 결함이 있다.

## Structure / Data changes
- settings: 빈 연락/사업자 문자열, 빈 지역 배열, 빈 이미지 구조, 기존 업체명/푸터 소개에서 도출한 SEO 값, 기존 승인된 문의 CTA(/inquiry)를 누락 키에만 추가한다. draft/published는 독립 보충하고 null 공개본은 유지한다. 변경한 행만 revision+1. 기존 키와 시간/작성자/게시 이력은 보존한다.
- pricing: updated_by/published_by가 null, revision이 원래 이관 계산값, 기존 site_content.draft에 priceItems 키가 없음, 현재 초안 배열이 비었음, 공개 항목 존재, 해당 문서의 운영 감사 없음이 모두 충족할 때만 draft.items를 published.items로 복구한다. 다른 초안 필드는 보존한다. revision+1, 고객 공개본/가격 테이블/이력은 그대로다.
- publish_content_document: 비UUID 가격 ID를 한 번만 UUID로 정규화한 뒤 같은 값을 draft/published/price_items에 원자적으로 쓴다. 유효 UUID는 보존한다. 기존 CAS 오류와 권한 검사를 유지한다.
- services.slug: 잘못된 case-UUID 기본값을 제거해 이미 기본값 없는 원격과 새 환경을 일치시킨다. 기존 서비스 값은 변경하지 않는다.

## Verification / Rollout
실패 재현 → 격리 PostgreSQL regression → 실제 콘텐츠 복제본에 migration 연습 → 독립 코드 리뷰 → 원격 dry run → 변경 전 지문/필드 백업 → linked apply → 실제 데이터 정합성/역할/공개 읽기/보존 검사. 테스트용 조회만 사용하고 운영에서 테스트 게시·업로드는 하지 않는다. 재실행 시 불필요한 버전 상승 없는지 확인한다.

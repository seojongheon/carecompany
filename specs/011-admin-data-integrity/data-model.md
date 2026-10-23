# Data model
새 테이블 없음. content_documents의 settings 누락 키와 pricing 최초 이관 초안을 보충한다. 문서 revision만 증가해 오래된 편집 요청을 거부한다. 이전 published_at/updated_by와 모든 버전 기록은 보존한다.
가격 게시 시 draft.items[].id = published.items[].id = price_items.id::text. 유효한 기존 UUID는 유지하고 이전 문자열 ID는 해당 게시에서 한 번 변환한다. 후속 게시·복원에서도 고객 내용과 연결 관계는 동일 트랜잭션으로 교체된다.
services.slug는 기존 데이터 및 NOT NULL/UNIQUE를 유지하되 부정확한 자동 생성 default만 제거한다.

# Data repair contract
`publish_content_document(document_key text, expected_revision integer)` 시그니처와 반환 content_documents 유지. 이전 형식 가격 ID는 성공 반환에서 UUID로 정규화된다. 실패 시 초안·공개본·가격·이력 모두 롤백. 권한은 기존 관리자/최고관리자 정책을 따른다.
이관은 필요한 누락 키만 추가하고 복구 조건 전체를 만족하는 가격 초안만 변경한다. 보완 대상 외 모든 행은 동일해야 한다. 운영 데이터 값을 로그에 출력하지 않는다.

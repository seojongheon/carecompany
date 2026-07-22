# Data Model

## SiteContentSnapshot

- `draft`: 관리자 편집 중인 콘텐츠
- `published`: 고객에게 표시되는 콘텐츠
- `versions`: 최근 게시 스냅샷
- `updatedAt`, `publishedAt`: 상태 표시용 시각

## SiteContent

- `home`: 히어로 문구·CTA·대표 이미지·과정 카드·노출 설정
- `services`: 기존 네 서비스의 편집 가능한 이름·요약·본문·활성 상태
- `pricing`: 서비스별 가격 항목, 안내문, FAQ
- `process`: 정렬 가능한 작업 과정 단계
- `about`: 소개 문구와 가치 항목
- `settings`: 상호·연락처·푸터 소개 문구

## Rules

- 필수 제목과 이미지 alt가 없으면 게시할 수 없다.
- 가격은 사례와 연결되지 않는다.
- 서비스 key는 수정하지 않는다.
- 고객 UI는 `published`만 사용한다.

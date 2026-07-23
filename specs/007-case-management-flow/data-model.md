# Data Model

새 테이블이나 마이그레이션은 없다.

## 기존 엔터티 사용

### CaseMedia

- `stage`: `before | process | after | detail`
- 작업 전 드롭존은 `before`, 작업 후 드롭존은 `after`를 생성 시점에 지정한다.
- 라이트박스 배지는 `stage`에서 파생하며 별도 저장 필드를 만들지 않는다.

## UI 계약

- `UploadPanel({ caseId, stage })`
- `stage`는 이번 화면에서 `before | after`만 허용한다.
- 파일 제한은 사례에 속한 전체 미디어 수를 기준으로 공유한다.

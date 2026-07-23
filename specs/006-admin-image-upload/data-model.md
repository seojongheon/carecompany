# Data Model: 관리자 이미지 업로드

## ImageUploadGuidance

- `label`: 관리자에게 보이는 대상 이름
- `recommendedWidth`, `recommendedHeight`: 권장 픽셀 크기
- `ratio`: 권장 가로세로 비율
- `formats`: 권장 파일 형식
- `maxFiles`: 한 번에 허용하는 파일 수

## HomeContent 추가 필드

- `heroImageUrl?`: 공개 랜딩에서 사용하는 처리된 이미지 URL
- `heroImageStoragePath?`: Storage 활성화 후 내부 저장 경로

두 필드는 선택값이다. 비어 있으면 기존 목업 히어로를 유지한다.

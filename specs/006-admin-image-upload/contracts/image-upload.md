# Image Upload Contract

- `ImageDropzone`은 `onFiles(files: File[])`으로 로컬 선택과 파일 드롭 결과를 동일하게 전달한다.
- 사례 대상은 여러 파일을 받고, 히어로 대상은 첫 번째 유효 파일만 선택한다.
- `ImageDropzone`은 권장 크기, 비율, 형식, 용량을 사용자에게 표시한다.
- Storage가 비활성일 때 결과 상태는 `preview_only`이며 원격 저장 완료로 표현하지 않는다.
- 공개 랜딩은 `heroImageUrl`이 있을 때 배경 이미지로 사용한다.

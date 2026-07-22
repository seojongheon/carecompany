# 목업 미디어

이 디렉터리의 SVG는 실제 고객 사진이 아니라 화면 구조와 오류 대체 상태를 검증하기
위한 로컬 플레이스홀더입니다. `features/portfolio/data/seed.ts`의 `MOCK_ASSETS`가
논리 키를 파일 경로에 연결합니다.

- 브라우저에서 고른 실제 사진은 object URL로 현재 세션에서만 미리 봅니다.
- object URL, Blob, File, base64 및 data URL은 `localStorage`에 저장하지 않습니다.
- 새로고침하면 선택 사진 대신 이 목업 이미지로 안전하게 복원됩니다.
- 출시 전 실제 Storage/CDN 자산과 서버 검증으로 교체해야 합니다.


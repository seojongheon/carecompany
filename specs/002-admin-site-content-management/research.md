# Research: 관리자 홈페이지 콘텐츠 관리

## Decision: 별도 사이트 콘텐츠 저장소와 Provider

- **Rationale**: 사례 저장소와 수명·검증·게시 규칙이 다르다. 독립 인터페이스가 후속 서버 저장소 전환을 단순화한다.
- **Alternatives considered**: 기존 포트폴리오 envelope 확장. 콘텐츠와 사례 미디어의 공개 규칙이 섞여 회귀 위험이 높아 제외했다.

## Decision: 초안과 게시 스냅샷 분리

- **Rationale**: 관리자가 저장 중인 내용을 고객에게 보이지 않게 하고, 게시 시에만 같은 브라우저의 고객 화면을 갱신한다.
- **Alternatives considered**: 편집 즉시 공개. 운영 실수와 불완전한 콘텐츠 노출 위험으로 제외했다.

## Decision: 목업 이미지 선택 방식

- **Rationale**: 현재 프로젝트 원칙은 이미지 파일을 localStorage에 저장하지 않는 것이다. seed/mock asset key를 선택·교체하는 UI로 실제 업로드 흐름을 검증한다.
- **Alternatives considered**: base64 localStorage 저장. 용량·안정성·원칙 위반으로 제외했다.

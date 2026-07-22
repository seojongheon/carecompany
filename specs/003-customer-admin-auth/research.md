# Research

## Decision: 교체 가능한 AuthRepository

- **Rationale**: UI가 현재 목업과 향후 Supabase 구현을 구분하지 않아도 된다.
- **Alternatives considered**: 화면에서 브라우저 저장소 직접 사용. 교체 비용이 커 제외했다.

## Decision: 관리자 인증은 잠금 상태만 구현

- **Rationale**: 슈퍼 계정과 관리자 계정이 없으므로 성공 세션을 만들면 승인된 보안 정책을 위반한다.
- **Alternatives considered**: 개발용 관리자 계정 seed. 자격 증명 노출과 운영 오사용 위험으로 제외했다.

## Decision: 고객 목업 비밀번호는 salt와 digest만 저장

- **Rationale**: UI 흐름을 재현하면서 원문 비밀번호 저장을 피한다. 운영 보안으로 간주하지 않는다.
- **Alternatives considered**: 원문 저장과 고정 데모 암호. 모두 제외했다.


# Auth Repository Contract

- `getSession()`: 현재 고객 목업 세션 또는 null
- `subscribe(listener)`: 세션 변경 구독
- `signUpCustomer(input)`: 고객 목업 계정 생성
- `signInCustomer(input)`: 고객 목업 로그인
- `signOut()`: 세션 종료
- `requestPasswordReset(email)`: 계정 존재 여부와 무관한 완료 결과
- `signInAdmin(input)`: 현재는 항상 안전한 미설정 결과
- `getAdminCapability()`: `unconfigured`

비밀번호 원문, 관리자 계정과 슈퍼 관리자 계정을 반환하거나 저장하지 않는다.


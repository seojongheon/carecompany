# Quickstart Validation

1. 고객 회원가입에서 유효성 오류와 성공 상태를 확인한다.
2. 로그아웃 후 가입한 고객 이메일·비밀번호로 로그인한다.
3. 비밀번호 재설정은 등록 여부와 무관하게 동일한 안내를 표시한다.
4. `/admin` 접근 시 `/admin/login` 잠금 상태를 표시한다.
5. 관리자 로그인에는 회원가입 링크가 없고 어떤 입력에도 성공 세션을 만들지 않는다.
6. `/admin/users`에 슈퍼 계정 정보 없이 연동 잠금 안내만 표시된다.
7. `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`를 실행한다.

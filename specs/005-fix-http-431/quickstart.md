# Quickstart: HTTP 431 수정 검증

## 자동 검사

```bash
pnpm exec vitest run tests/integration/http-header-runtime.test.ts
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 실제 서버 검사

1. 기존 개발 서버를 종료한다.
2. `pnpm dev`로 다시 시작한다.
3. 정상 요청과 17KB·32KB·70KB 쿠키 헤더 요청을 `localhost:3000`에 보낸다.
4. 정상·17KB·32KB 요청은 200, 70KB 요청은 431인지 확인한다.
5. `/login`과 `/admin/login`이 200인지 확인한다.

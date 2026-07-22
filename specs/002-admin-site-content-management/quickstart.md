# Quickstart Validation

1. `pnpm test -- --run`으로 단위·컴포넌트 테스트를 실행한다.
2. `/admin/site`에서 홈 문구와 CTA를 변경하고 `초안 저장`을 선택한다.
3. `/`에서 고객 화면이 아직 이전 게시본인지 확인한다.
4. 관리자에서 `게시`를 선택하고 고객 홈의 새 문구를 확인한다.
5. `/admin/site` 가격 탭에서 가격 항목을 추가·정렬·게시하고 `/pricing`에서 순서를 확인한다.
6. 홈 대표 이미지에 alt를 비운 뒤 게시가 차단되는지 확인한다.
7. `pnpm lint`, `pnpm typecheck`, `pnpm build`를 실행한다.

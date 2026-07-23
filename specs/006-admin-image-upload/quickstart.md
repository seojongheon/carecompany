# Quickstart: 관리자 이미지 업로드 검증

1. `pnpm dev`를 실행하고 `/admin/portfolio/<사례>/edit`에 로그인한다.
2. 사례 사진 영역에 JPG/WebP를 드롭하고 미리보기·권장 크기 안내·파일 입력 동작을 확인한다.
3. `/admin/site`의 홈 탭에서 히어로 이미지를 드롭하고 대체 텍스트를 입력한다.
4. Storage 비활성 안내가 실제 원격 저장 성공을 표시하지 않는지 확인한다.
5. 테스트와 정적 검사를 실행한다.

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

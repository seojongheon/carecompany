# Admin Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사례 사진과 랜딩 히어로 이미지를 관리자 화면에서 드래그앤드롭 또는 로컬 파일 선택으로 준비하고, 권장 크기·Storage 상태·공개 랜딩 반영을 일관되게 제공한다.

**Architecture:** 공통 `ImageDropzone`이 클릭과 드롭을 같은 `File[]` 흐름으로 전달하고, 사례와 히어로 관리 화면은 대상별 수량·권장 비율만 주입한다. Storage가 꺼진 상태에서는 브라우저 미리보기만 만들며, `heroImageUrl`이 저장된 공개 콘텐츠만 랜딩에 실제 배경으로 사용한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library, existing Supabase Storage gateway

## Global Constraints

- 사례 사진 권장값은 1600 × 1200px, 4:3, JPG/WebP다.
- 히어로 권장값은 1920 × 1080px, 16:9, JPG/WebP다.
- 파일당 20MB, 사례당 69장, 한 번에 20장 제한을 유지한다.
- 권장 비율 불일치는 경고하며 유효한 이미지를 막지 않는다.
- Storage는 `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true` 전까지 실제 업로드를 수행하지 않는다.
- 공개 랜딩에는 `heroImageUrl`만 사용하며, 없을 때 기존 목업을 유지한다.
- 실제 Storage 버킷·정책은 별도 활성화 승인이 없으므로 변경하지 않는다.

---

### Task 1: 공통 이미지 드롭존과 권장값

**Files:**
- Create: `features/uploads/model/image-upload-guidance.ts`
- Create: `features/uploads/ui/image-dropzone.tsx`
- Create: `tests/component/image-upload-flows.test.tsx`

**Interfaces:**
- Produces `CASE_IMAGE_GUIDANCE`, `LANDING_HERO_IMAGE_GUIDANCE` and `ImageDropzone({ guidance, multiple, disabled, onFiles })`.

- [ ] **Step 1: Write failing component tests**

```tsx
render(<ImageDropzone guidance={CASE_IMAGE_GUIDANCE} multiple onFiles={onFiles} />);
await user.upload(screen.getByLabelText("사례 사진 파일 선택"), file);
expect(onFiles).toHaveBeenCalledWith([file]);
expect(screen.getByText("권장 1600 × 1200px · 4:3 · JPG 또는 WebP")).toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/component/image-upload-flows.test.tsx`

Expected: FAIL because the common guidance and dropzone modules do not exist.

- [ ] **Step 3: Implement the minimal dropzone**

```tsx
export function ImageDropzone({ guidance, multiple = false, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = (files: FileList | File[]) => onFiles(Array.from(files));
  return <div onDrop={(event) => { event.preventDefault(); submit(event.dataTransfer.files); }}>
    <input ref={inputRef} type="file" multiple={multiple} onChange={(event) => submit(event.target.files ?? [])} />
    <Button type="button" onClick={() => inputRef.current?.click()}>파일 고르기</Button>
  </div>;
}
```

- [ ] **Step 4: Run the focused test**

Run: `pnpm exec vitest run tests/component/image-upload-flows.test.tsx`

Expected: PASS.

### Task 2: 사례 업로드 화면 연결

**Files:**
- Modify: `features/uploads/ui/upload-panel.tsx`
- Modify: `tests/component/image-upload-flows.test.tsx`

**Interfaces:**
- Consumes `ImageDropzone` and `CASE_IMAGE_GUIDANCE`.
- Preserves `validateFileSelection(files, existingCount)` and `SessionPreviewManager`.

- [ ] **Step 1: Add a failing case upload drop test**

```tsx
fireEvent.drop(screen.getByTestId("case-image-dropzone"), { dataTransfer: { files: [file] } });
expect(await screen.findByText(file.name)).toBeInTheDocument();
expect(screen.getByText(/Storage 활성화 후 실제 저장/)).toBeInTheDocument();
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `pnpm exec vitest run tests/component/image-upload-flows.test.tsx`

Expected: FAIL because the case panel has no shared drop target.

- [ ] **Step 3: Replace the hidden input wrapper with ImageDropzone**

Keep the existing selection validator, upload preview manager, retry, and Storage-disabled behavior. Add the 4:3 recommendation and use `data-testid="case-image-dropzone"` through the component.

- [ ] **Step 4: Run focused test**

Run: `pnpm exec vitest run tests/component/image-upload-flows.test.tsx`

Expected: PASS.

### Task 3: 랜딩 히어로 이미지 초안과 공개 폴백

**Files:**
- Modify: `features/site-content/model/types.ts`
- Modify: `features/site-content/model/seed.ts`
- Create: `features/site-content/ui/landing-hero-image-manager.tsx`
- Modify: `features/site-content/ui/site-content-admin.tsx`
- Modify: `components/site/home-sections.tsx`
- Modify: `tests/component/image-upload-flows.test.tsx`

**Interfaces:**
- Adds `heroImageUrl?: string` and `heroImageStoragePath?: string` to `HomeContent`.
- `LandingHeroImageManager` consumes `HomeContent` and calls `onChange(nextHome)`.

- [ ] **Step 1: Add failing landing image tests**

```tsx
render(<HomeSections />);
expect(screen.getByRole("img", { name: "테스트 히어로" })).toHaveStyle({ backgroundImage: "url(https://images.example/hero.webp)" });
```

```tsx
render(<LandingHeroImageManager home={home} onChange={onChange} />);
await user.upload(screen.getByLabelText("랜딩 대표이미지 파일 선택"), file);
expect(screen.getByText("권장 1920 × 1080px · 16:9 · JPG 또는 WebP")).toBeInTheDocument();
expect(screen.getByText(/Storage 활성화 후 실제 저장/)).toBeInTheDocument();
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `pnpm exec vitest run tests/component/image-upload-flows.test.tsx`

Expected: FAIL because the model has no public hero URL and the manager does not exist.

- [ ] **Step 3: Implement the minimal model, manager, and public renderer**

Use `URL.createObjectURL` only for the local manager preview. Do not write a browser blob URL into persistent content. The manager keeps an explicit preview-only notice until Storage is enabled. The public renderer applies `backgroundImage` only when `home.heroImageUrl` exists.

- [ ] **Step 4: Run focused test**

Run: `pnpm exec vitest run tests/component/image-upload-flows.test.tsx`

Expected: PASS.

### Task 4: Regression verification

**Files:**
- Test: `tests/component/image-upload-flows.test.tsx`
- Test: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Run focused and related tests**

Run: `pnpm exec vitest run tests/component/image-upload-flows.test.tsx tests/component/admin-publishing.test.tsx tests/component/public-browse.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run quality gates**

Run: `pnpm lint && pnpm typecheck && pnpm test`

Expected: all commands exit 0.

- [ ] **Step 3: Run authenticated route coverage and build**

Run: `env -u CI pnpm exec playwright test tests/e2e/auth.spec.ts tests/e2e/hydration-diagnostic.spec.ts --project=desktop-chromium --workers=1`

Run: `pnpm build`

Expected: Playwright and production build PASS.

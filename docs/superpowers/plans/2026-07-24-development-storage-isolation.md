# Development Storage Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guarantee that local development and tests never upload, read, or delete Supabase Storage objects while production Storage behavior remains available.

**Architecture:** Centralize the production-only Storage decision in the existing upload runtime model. All client Storage entry points consume the same pure decision so an enabled local environment variable cannot bypass the development lock.

**Tech Stack:** TypeScript, React, Next.js environment variables, Vitest, Testing Library

## Global Constraints

- Development and test environments never access Supabase Storage.
- Production accesses Supabase Storage only when `NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true`.
- Supabase database and authentication behavior remain unchanged.
- Development uploads are session-only simulated previews.
- Development rendering uses existing service-specific mock images.
- Agent Markdown documents remain uncommitted.

---

### Task 1: Production-only Storage runtime policy

**Files:**
- Modify: `features/uploads/model/upload-runtime.ts`
- Modify: `tests/unit/storage/upload-runtime.test.ts`

**Interfaces:**
- Produces: `isSupabaseStorageAllowed(storageEnabled: boolean, environment?: string): boolean`
- Produces: `getUploadRuntime(repository, storageEnabled, environment?): "supabase" | "development" | "deferred" | "mock"`

- [ ] **Step 1: Write failing policy tests**

Add assertions that enabled development and test environments return `false` and select `development`, while enabled production returns `true` and selects `supabase`.

- [ ] **Step 2: Verify RED**

Run: `node_modules/.bin/vitest run tests/unit/storage/upload-runtime.test.ts`

Expected: FAIL because development currently selects `supabase` and the policy function does not exist.

- [ ] **Step 3: Implement the minimum policy**

Allow Storage only when both the public flag is enabled and the environment equals `production`. Preserve `mock` for explicitly injected local repositories.

- [ ] **Step 4: Verify GREEN**

Run: `node_modules/.bin/vitest run tests/unit/storage/upload-runtime.test.ts`

Expected: all upload runtime tests pass.

### Task 2: Block signed URL reads and Storage deletion

**Files:**
- Modify: `features/portfolio/storage/use-case-media-urls.ts`
- Modify: `features/uploads/ui/photo-manager.tsx`
- Create: `tests/component/storage-development-guard.test.tsx`

**Interfaces:**
- Consumes: `isSupabaseStorageAllowed`
- Produces: no Storage client request in development; mock asset fallback remains active

- [ ] **Step 1: Write a failing hook test**

Render `useCaseMediaUrls` with a media item containing `storagePath` under a development environment and assert that `storage.from` is never called.

- [ ] **Step 2: Verify RED**

Run: `node_modules/.bin/vitest run tests/component/storage-development-guard.test.tsx`

Expected: FAIL because the hook currently requests a signed URL whenever a Storage path exists.

- [ ] **Step 3: Apply the policy to reads and deletes**

Build no signed URL request when the policy denies Storage, and apply the same policy before the photo manager removes originals or reviewed files.

- [ ] **Step 4: Verify GREEN**

Run: `node_modules/.bin/vitest run tests/component/storage-development-guard.test.tsx`

Expected: the hook test passes without a Storage call.

### Task 3: Development upload behavior and complete verification

**Files:**
- Modify: `features/uploads/ui/upload-panel.tsx`
- Modify: `tests/component/image-upload-flows.test.tsx`

**Interfaces:**
- Consumes: `getUploadRuntime`
- Produces: session-only development previews and an explicit no-Storage notice

- [ ] **Step 1: Write failing UI behavior assertions**

Assert that a Supabase repository in development shows the no-Storage development notice and never persists a selected file through the repository.

- [ ] **Step 2: Verify RED**

Run: `node_modules/.bin/vitest run tests/component/image-upload-flows.test.tsx`

Expected: FAIL because enabled development currently selects the real Supabase upload path.

- [ ] **Step 3: Implement the development notice and session-only flow**

Pass the environment through the centralized runtime policy and add the development-specific explanatory copy. Do not enqueue metadata persistence after simulated development uploads.

- [ ] **Step 4: Run complete verification**

Run:

```bash
node_modules/.bin/vitest run
node_modules/.bin/tsc --noEmit
node_modules/.bin/eslint . --max-warnings=0
node_modules/.bin/next build
```

Expected: all tests, type checking, linting, and production build pass.

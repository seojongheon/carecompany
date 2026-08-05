# Automatic Case SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove manual SEO inputs from case registration and generate each public case page's SEO title and description from its actual case content.

**Architecture:** Add a pure case SEO builder beside the portfolio domain model. The public case route will use that builder for metadata and Article structured data, while the admin form will stop reading or writing legacy SEO fields. Existing nullable database columns remain untouched for backward compatibility but no longer affect public output.

**Tech Stack:** TypeScript, Next.js metadata API, React Hook Form, Vitest, Testing Library

## Global Constraints

- SEO text must use location, service, case title, pre-work condition, work performed, and result where available.
- Placeholder draft copy and blank values must not appear in public metadata.
- Generated text must be readable sentences, not a keyword list.
- Existing manually stored `seoTitle` and `seoDescription` values must be ignored.
- The admin case form must contain no editable SEO title or description inputs.
- No database migration or external AI/API dependency is permitted.
- Planning documents and other agent Markdown files must not be committed.

---

### Task 1: Pure automatic SEO builder

**Files:**
- Create: `features/portfolio/model/case-seo.ts`
- Create: `tests/unit/case-seo.test.ts`

**Interfaces:**
- Consumes: `PublicCaseDetail`
- Produces: `buildCaseSeo(detail: PublicCaseDetail): { title: string; description: string }`

- [ ] **Step 1: Write failing tests**

Add tests proving that the builder includes location and service in the title, composes the three work narratives into a readable description, ignores legacy manual SEO fields, skips draft placeholders, and uses summary/title fallbacks when narratives are missing.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test tests/unit/case-seo.test.ts`

Expected: FAIL because `features/portfolio/model/case-seo.ts` does not exist.

- [ ] **Step 3: Implement the pure builder**

Normalize whitespace, remove duplicate terminal punctuation, exclude known draft placeholders, and compose one page-specific title and description without keyword stuffing.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm test tests/unit/case-seo.test.ts`

Expected: all case SEO tests pass.

### Task 2: Public metadata integration and admin input removal

**Files:**
- Modify: `app/(site)/portfolio/[slug]/page.tsx`
- Modify: `features/portfolio/ui/admin-case-form.tsx`
- Modify: `tests/component/admin-drafts.test.tsx`

**Interfaces:**
- Consumes: `buildCaseSeo(detail)`
- Produces: generated page metadata and Article structured data; an admin form without SEO fields

- [ ] **Step 1: Write failing admin-form test**

Add an edit-form assertion that `SEO 제목`, `SEO 설명`, and the old SEO information section are absent.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test tests/component/admin-drafts.test.tsx`

Expected: FAIL because the old editable SEO controls are still rendered.

- [ ] **Step 3: Remove SEO form state and connect public metadata**

Remove `seoTitle` and `seoDescription` from the form schema, defaults, restored values, autosave payload, and rendered controls. Generate both Next.js metadata and Article structured data from `buildCaseSeo(item)`.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
pnpm test tests/unit/case-seo.test.ts tests/component/admin-drafts.test.tsx
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit successfully with no warnings treated as errors.

# Contract: Portfolio repository and store

## Purpose

This UI-facing contract isolates page components from browser persistence now and Supabase
later. All methods return domain-safe copies and never expose the serialized envelope.

```ts
interface PortfolioRepository {
  getSnapshot(): MockStoreEnvelope;
  subscribe(listener: () => void): () => void;

  listServices(): Service[];
  listPublicCases(query: PortfolioQuery): PortfolioPage;
  getPublicCaseBySlug(slug: string): PublicCaseDetail | null;
  listRelatedPublicCases(caseId: string, limit: number): PortfolioCardView[];

  listAdminCases(filter: AdminCaseFilter): AdminCaseSummary[];
  getAdminCaseById(id: string): AdminCaseDetail | null;
  createDraft(input: CreateDraftInput): PortfolioCase;
  updateCase(id: string, patch: UpdateCaseInput): PortfolioCase;
  setCaseMedia(id: string, media: CaseMedia[]): CaseMedia[];
  setCaseVideos(id: string, videos: CaseVideo[]): CaseVideo[];
  publishCase(id: string): PublishResult;
  unpublishCase(id: string): PortfolioCase;
  softDeleteCase(id: string): void;
  resetToSeed(): void;
}
```

## Contract rules

- Every mutation validates input before persistence and emits exactly one subscription event.
- `createDraft` always returns a private case with a unique ID and slug.
- Public reads reapply status, media visibility, and readiness rules on every call.
- `publishCase` is atomic from the UI perspective: either all checks pass or no state changes.
- `unpublishCase` removes the case from public reads immediately.
- `resetToSeed` revokes all active object URLs through the session preview owner before reset.
- Corrupt storage never reaches consumers; the adapter returns the seed snapshot and a
  recoverable notification.

## Publish result

```ts
type PublishIssueCode =
  | "missing-title"
  | "missing-service"
  | "missing-location"
  | "missing-cover"
  | "missing-public-media"
  | "privacy-checklist-incomplete";

type PublishResult =
  | { ok: true; case: PortfolioCase }
  | { ok: false; issues: Array<{ code: PublishIssueCode; message: string }> };
```

Messages are Korean user-facing explanations. Codes remain stable for tests and future server
mapping.

## Future adapter compatibility

The future Supabase adapter may make operations asynchronous. The UI store/provider owns that
transition and exposes loading/error state; route and component props remain domain-oriented.
The backend milestone must revisit this contract before implementation and update the deferred
integration checklist if signatures change.

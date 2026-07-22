# Data Model: 위생의 기술 프런트엔드 목업 포트폴리오

## Storage envelope

```ts
type MockStoreEnvelope = {
  schemaVersion: 1;
  savedAt: string;
  services: Service[];
  cases: PortfolioCase[];
  media: CaseMedia[];
  videos: CaseVideo[];
  tags: Tag[];
  caseTagIds: Record<string, string[]>;
};
```

The adapter validates the full envelope before use. Invalid data is copied to a timestamped
recovery key, then replaced with the immutable seed snapshot. Only JSON-safe metadata is
stored. Object URLs, `File`, Blob, base64, and data URLs are forbidden.

## Service

```ts
type ServiceKey =
  | "bathroom"
  | "aircon"
  | "apartment-window"
  | "commercial-window";

type Service = {
  id: string;
  key: ServiceKey;
  name: string;
  slug: string;
  summary: string;
  description: string;
  coverAssetKey: string;
  sortOrder: number;
  active: boolean;
};
```

Validation: exactly four seed services; unique `id`, `key`, and `slug`; non-empty Korean
name and copy; stable sort order.

## PortfolioCase

```ts
type CaseStatus = "private" | "published" | "deleted";

type PortfolioCase = {
  id: string;
  serviceId: string;
  slug: string;
  title: string;
  summary: string;
  locationDisplay: string;
  spaceType: string;
  workDate: string;
  displayPeriod: string;
  problemDescription: string;
  workDescription: string;
  resultDescription: string;
  status: CaseStatus;
  featuredRank: number | null;
  privacyChecklist: PublishChecklist;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Validation: unique `id` and `slug`; service must exist; new records start `private`;
`locationDisplay` must not contain detailed address/contact patterns; published records need
a completed checklist and at least one ready public media item.

State transitions:

```text
private --publish validation passes--> published
published --unpublish--> private
private|published --soft delete--> deleted
deleted --not supported in this milestone--> private|published
```

## CaseMedia

```ts
type MediaStage = "before" | "process" | "after" | "detail";
type UploadStatus = "queued" | "uploading" | "ready" | "failed";

type CaseMedia = {
  id: string;
  caseId: string;
  stage: MediaStage;
  sortOrder: number;
  cover: boolean;
  public: boolean;
  altText: string;
  caption: string;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";
  sizeBytes: number;
  uploadStatus: UploadStatus;
  mockAssetKey: string;
  sessionPreviewId: string | null;
};
```

Validation: no more than 69 non-deleted media items per case; exactly zero or one cover per
case; cover must be ready and public before publication; public selectors include only
`public && uploadStatus === "ready"`; customer numbering is recalculated after filtering.
`sessionPreviewId` is never serialized and is cleared during hydration.

## SessionPreview

```ts
type SessionPreview = {
  id: string;
  file: File;
  objectUrl: string;
  progress: number;
  error: string | null;
};
```

Lifecycle: create after validation; update progress during the simulated upload; revoke
`objectUrl` when replaced, removed, reset, or provider unmounts. A reload removes all entries.

## Tag and case tags

```ts
type TagType = "space" | "contamination" | "scope";

type Tag = {
  id: string;
  serviceId: string;
  key: string;
  name: string;
  type: TagType;
  sortOrder: number;
  active: boolean;
};
```

Each case references tag IDs through `caseTagIds[caseId]`. Tags must belong to the case's
service. Customer filters use only active tags attached to at least one public case.

## CaseVideo

```ts
type CaseVideo = {
  id: string;
  caseId: string;
  youtubeVideoId: string;
  originalUrl: string;
  title: string;
  caption: string;
  sortOrder: number;
  public: boolean;
};
```

Validation: maximum three per case; video ID is derived only from supported watch,
`youtu.be`, or Shorts URLs; customer selectors include public videos for published cases.

## PublishChecklist

```ts
type PublishChecklist = {
  noIdentifiablePeople: boolean;
  noVehiclePlates: boolean;
  noDetailedAddressOrContact: boolean;
  noPrivateDocumentsOrBelongings: boolean;
  publicMediaReviewed: boolean;
  requiredMetadataComplete: boolean;
  hasPublicReadyMedia: boolean;
};
```

All seven values must be true at the moment of publication. Derived checks are recalculated
when case metadata or media visibility changes rather than trusted from stale storage.

## Query and page result

```ts
type PortfolioQuery = {
  serviceKey?: ServiceKey;
  tagKeys?: string[];
  cursor?: string;
  limit: number;
};

type PortfolioPage = {
  items: PortfolioCardView[];
  nextCursor: string | null;
  totalPublic: number;
};
```

Ordering: non-null `featuredRank` ascending, then `publishedAt` descending, then `id`
ascending. The cursor encodes the stable ordering tuple, not an array offset.

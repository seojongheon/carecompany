export const SERVICE_KEYS = [
  "bathroom",
  "aircon",
  "apartment-window",
  "commercial-window",
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];
export type CaseStatus = "private" | "published" | "deleted";
export type MediaStage = "before" | "process" | "after" | "detail";
export type UploadStatus = "queued" | "uploading" | "ready" | "failed";
export type TagType = "space" | "contamination" | "scope";

export interface PublishChecklist {
  noIdentifiablePeople: boolean;
  noVehiclePlates: boolean;
  noDetailedAddressOrContact: boolean;
  noPrivateDocumentsOrBelongings: boolean;
  publicMediaReviewed: boolean;
  requiredMetadataComplete: boolean;
  hasPublicReadyMedia: boolean;
}

export interface Service {
  id: string;
  key: ServiceKey;
  name: string;
  slug: string;
  summary: string;
  description: string;
  coverAssetKey: string;
  sortOrder: number;
  active: boolean;
}

export interface PortfolioCase {
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
  seoTitle?: string;
  seoDescription?: string;
  status: CaseStatus;
  featuredRank: number | null;
  privacyChecklist: PublishChecklist;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseMedia {
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
  storagePath?: string;
  originalStoragePath?: string;
  sessionPreviewId: string | null;
}

export interface CaseVideo {
  id: string;
  caseId: string;
  youtubeVideoId: string;
  originalUrl: string;
  title: string;
  caption: string;
  sortOrder: number;
  public: boolean;
}

export interface Tag {
  id: string;
  serviceId: string;
  key: string;
  name: string;
  type: TagType;
  sortOrder: number;
  active: boolean;
}

export interface MockStoreEnvelope {
  schemaVersion: 1;
  savedAt: string;
  services: Service[];
  cases: PortfolioCase[];
  media: CaseMedia[];
  videos: CaseVideo[];
  tags: Tag[];
  caseTagIds: Record<string, string[]>;
}

export interface PortfolioQuery {
  serviceKey?: ServiceKey;
  tagKeys?: string[];
  cursor?: string;
  limit: number;
}

export interface PortfolioCardView extends PortfolioCase {
  service: Service;
  coverMedia: CaseMedia;
  publicMediaCount: number;
  tags: Tag[];
}

export interface PublicCaseDetail extends PortfolioCardView {
  media: CaseMedia[];
  videos: CaseVideo[];
}

export interface PortfolioPage {
  items: PortfolioCardView[];
  nextCursor: string | null;
  totalPublic: number;
}

export interface AdminCaseFilter {
  status?: CaseStatus | "all";
  serviceKey?: ServiceKey;
}

export type AdminCaseSummary = PortfolioCase & {
  service: Service;
  mediaCount: number;
};

export type AdminCaseDetail = PortfolioCase & {
  service: Service;
  media: CaseMedia[];
  videos: CaseVideo[];
  tags: Tag[];
};

export interface CreateDraftInput {
  serviceId: string;
  title: string;
  locationDisplay: string;
}

export type UpdateCaseInput = Partial<
  Omit<PortfolioCase, "id" | "createdAt" | "updatedAt" | "status" | "publishedAt">
>;

export type PublishIssueCode =
  | "missing-title"
  | "missing-service"
  | "missing-location"
  | "missing-cover"
  | "missing-public-media"
  | "deleted-case"
  | "privacy-checklist-incomplete";

export type PublishResult =
  | { ok: true; case: PortfolioCase }
  | { ok: false; issues: Array<{ code: PublishIssueCode; message: string }> };

export interface SessionPreview {
  id: string;
  file: File;
  objectUrl: string;
  progress: number;
  error: string | null;
}

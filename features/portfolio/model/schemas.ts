import { z } from "zod";

import { SERVICE_KEYS as SERVICE_KEY_VALUES } from "./types";

export const SERVICE_KEYS = SERVICE_KEY_VALUES;
export const MAX_FILES_PER_SELECTION = 20;
export const MAX_MEDIA_PER_CASE = 69;
export const MAX_VIDEOS_PER_CASE = 3;

const NonEmptyText = z.string().trim().min(1);
const IsoDateTime = z.string().datetime({ offset: true });

export const ServiceKeySchema = z.enum(SERVICE_KEYS);
export const PublishChecklistSchema = z.object({
  noIdentifiablePeople: z.boolean(),
  noVehiclePlates: z.boolean(),
  noDetailedAddressOrContact: z.boolean(),
  noPrivateDocumentsOrBelongings: z.boolean(),
  publicMediaReviewed: z.boolean(),
  requiredMetadataComplete: z.boolean(),
  hasPublicReadyMedia: z.boolean(),
});

export const ServiceSchema = z.object({
  id: NonEmptyText,
  key: ServiceKeySchema,
  name: NonEmptyText,
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: NonEmptyText,
  description: NonEmptyText,
  coverAssetKey: NonEmptyText,
  sortOrder: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const PortfolioCaseSchema = z.object({
  id: NonEmptyText,
  serviceId: NonEmptyText,
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: NonEmptyText,
  summary: NonEmptyText,
  locationDisplay: NonEmptyText,
  spaceType: NonEmptyText,
  workDate: z.iso.date(),
  displayPeriod: NonEmptyText,
  problemDescription: NonEmptyText,
  workDescription: NonEmptyText,
  resultDescription: NonEmptyText,
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
  status: z.enum(["private", "published", "deleted"]),
  featuredRank: z.number().int().positive().nullable(),
  privacyChecklist: PublishChecklistSchema,
  publishedAt: IsoDateTime.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});

export const NewPortfolioCaseSchema = z.object({
  serviceId: NonEmptyText,
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: NonEmptyText,
  locationDisplay: NonEmptyText,
  status: z.literal("private").default("private"),
  publishedAt: z.null().default(null),
});

export const CaseMediaSchema = z.object({
  id: NonEmptyText,
  caseId: NonEmptyText,
  stage: z.enum(["before", "process", "after", "detail"]),
  sortOrder: z.number().int().nonnegative(),
  cover: z.boolean(),
  public: z.boolean(),
  altText: NonEmptyText,
  caption: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]),
  sizeBytes: z.number().int().nonnegative().max(20 * 1024 * 1024),
  uploadStatus: z.enum(["queued", "uploading", "ready", "failed"]),
  mockAssetKey: NonEmptyText.refine(
    (value) => !value.startsWith("blob:") && !value.startsWith("data:"),
    "세션 또는 인라인 이미지 주소는 저장할 수 없습니다.",
  ),
  sessionPreviewId: z.null(),
});

export const CaseVideoSchema = z.object({
  id: NonEmptyText,
  caseId: NonEmptyText,
  youtubeVideoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  originalUrl: z.url(),
  title: NonEmptyText,
  caption: z.string(),
  sortOrder: z.number().int().nonnegative(),
  public: z.boolean(),
});

export const TagSchema = z.object({
  id: NonEmptyText,
  serviceId: NonEmptyText,
  key: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: NonEmptyText,
  type: z.enum(["space", "contamination", "scope"]),
  sortOrder: z.number().int().nonnegative(),
  active: z.boolean(),
});

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

function checklistComplete(checklist: z.infer<typeof PublishChecklistSchema>) {
  return Object.values(checklist).every(Boolean);
}

export const MockStoreEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    savedAt: IsoDateTime,
    services: z.array(ServiceSchema).length(4),
    cases: z.array(PortfolioCaseSchema),
    media: z.array(CaseMediaSchema),
    videos: z.array(CaseVideoSchema),
    tags: z.array(TagSchema),
    caseTagIds: z.record(z.string(), z.array(z.string())),
  })
  .superRefine((store, context) => {
    const uniqueCollections = [
      ["서비스 ID", store.services.map(({ id }) => id)],
      ["서비스 키", store.services.map(({ key }) => key)],
      ["서비스 경로", store.services.map(({ slug }) => slug)],
      ["사례 ID", store.cases.map(({ id }) => id)],
      ["사례 경로", store.cases.map(({ slug }) => slug)],
      ["미디어 ID", store.media.map(({ id }) => id)],
      ["영상 ID", store.videos.map(({ id }) => id)],
      ["태그 ID", store.tags.map(({ id }) => id)],
    ] as const;

    for (const [label, values] of uniqueCollections) {
      if (hasDuplicates(values)) {
        context.addIssue({ code: "custom", message: `${label}가 중복되었습니다.` });
      }
    }

    const serviceIds = new Set(store.services.map(({ id }) => id));
    const caseIds = new Set(store.cases.map(({ id }) => id));
    const tagById = new Map(store.tags.map((tag) => [tag.id, tag]));

    for (const portfolioCase of store.cases) {
      if (!serviceIds.has(portfolioCase.serviceId)) {
        context.addIssue({ code: "custom", message: "사례가 존재하지 않는 서비스를 참조합니다." });
      }

      const caseMedia = store.media.filter(({ caseId }) => caseId === portfolioCase.id);
      const caseVideos = store.videos.filter(({ caseId }) => caseId === portfolioCase.id);
      const covers = caseMedia.filter(({ cover }) => cover);

      if (caseMedia.length > MAX_MEDIA_PER_CASE) {
        context.addIssue({ code: "custom", message: `사례당 사진은 ${MAX_MEDIA_PER_CASE}장까지 등록할 수 있습니다.` });
      }
      if (caseVideos.length > MAX_VIDEOS_PER_CASE) {
        context.addIssue({ code: "custom", message: `사례당 영상은 ${MAX_VIDEOS_PER_CASE}개까지 등록할 수 있습니다.` });
      }
      if (covers.length > 1) {
        context.addIssue({ code: "custom", message: "대표 사진은 하나만 지정할 수 있습니다." });
      }

      if (portfolioCase.status === "published") {
        const hasReadyPublicMedia = caseMedia.some(
          (item) => item.public && item.uploadStatus === "ready",
        );
        const validCover = covers.some(
          (item) => item.public && item.uploadStatus === "ready",
        );
        if (
          !portfolioCase.publishedAt ||
          !checklistComplete(portfolioCase.privacyChecklist) ||
          !hasReadyPublicMedia ||
          !validCover
        ) {
          context.addIssue({ code: "custom", message: "공개 사례의 필수 검토와 공개 미디어가 부족합니다." });
        }
      }

      for (const tagId of store.caseTagIds[portfolioCase.id] ?? []) {
        const tag = tagById.get(tagId);
        if (!tag || tag.serviceId !== portfolioCase.serviceId) {
          context.addIssue({ code: "custom", message: "사례와 태그의 서비스가 일치하지 않습니다." });
        }
      }
    }

    for (const item of [...store.media, ...store.videos]) {
      if (!caseIds.has(item.caseId)) {
        context.addIssue({ code: "custom", message: "미디어가 존재하지 않는 사례를 참조합니다." });
      }
    }
  });

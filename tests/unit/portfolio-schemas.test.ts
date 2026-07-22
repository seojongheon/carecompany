import { describe, expect, it } from "vitest";

import {
  MAX_MEDIA_PER_CASE,
  MAX_VIDEOS_PER_CASE,
  MockStoreEnvelopeSchema,
  NewPortfolioCaseSchema,
  SERVICE_KEYS,
} from "@/features/portfolio/model/schemas";

const checklist = {
  noIdentifiablePeople: true,
  noVehiclePlates: true,
  noDetailedAddressOrContact: true,
  noPrivateDocumentsOrBelongings: true,
  publicMediaReviewed: true,
  requiredMetadataComplete: true,
  hasPublicReadyMedia: true,
};

const services = SERVICE_KEYS.map((key, index) => ({
  id: `service-${index + 1}`,
  key,
  name: ["화장실 청소", "에어컨 청소", "아파트 유리창 청소", "상가 유리창 청소"][index],
  slug: key,
  summary: "안전하고 꼼꼼한 위생 관리",
  description: "현장 상태를 확인하고 필요한 범위만 정직하게 안내합니다.",
  coverAssetKey: `service-${index + 1}`,
  sortOrder: index + 1,
  active: true,
}));

const baseCase = {
  id: "case-1",
  serviceId: "service-1",
  slug: "sample-case",
  title: "생활 오염을 정리한 화장실",
  summary: "오염 상태에 맞춰 작업한 사례입니다.",
  locationDisplay: "서울 마포구",
  spaceType: "아파트",
  workDate: "2026-07-01",
  displayPeriod: "2026년 7월",
  problemDescription: "물때와 비누 찌꺼기가 쌓여 있었습니다.",
  workDescription: "표면에 맞는 도구로 구역별 세척을 진행했습니다.",
  resultDescription: "사용하기 편안한 상태로 정리했습니다.",
  status: "private" as const,
  featuredRank: null,
  privacyChecklist: checklist,
  publishedAt: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const media = (index: number) => ({
  id: `media-${index}`,
  caseId: "case-1",
  stage: "after" as const,
  sortOrder: index,
  cover: index === 0,
  public: true,
  altText: "청소 후 정돈된 공간",
  caption: "작업 후",
  width: 1200,
  height: 800,
  mimeType: "image/jpeg" as const,
  sizeBytes: 250_000,
  uploadStatus: "ready" as const,
  mockAssetKey: "bathroom-after",
  sessionPreviewId: null,
});

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1 as const,
    savedAt: "2026-07-22T00:00:00.000Z",
    services,
    cases: [baseCase],
    media: [media(0)],
    videos: [],
    tags: [],
    caseTagIds: { "case-1": [] },
    ...overrides,
  };
}

describe("portfolio schemas", () => {
  it("defines exactly the four PRD service keys", () => {
    expect(SERVICE_KEYS).toEqual([
      "bathroom",
      "aircon",
      "apartment-window",
      "commercial-window",
    ]);
  });

  it("rejects duplicate service and case slugs", () => {
    const duplicateServices = [...services, { ...services[0], id: "service-5" }];
    const duplicateCases = [baseCase, { ...baseCase, id: "case-2" }];

    expect(MockStoreEnvelopeSchema.safeParse(envelope({ services: duplicateServices })).success).toBe(false);
    expect(MockStoreEnvelopeSchema.safeParse(envelope({ cases: duplicateCases })).success).toBe(false);
  });

  it("defaults a newly parsed case to private", () => {
    const result = NewPortfolioCaseSchema.parse({
      serviceId: "service-1",
      slug: "new-case",
      title: "새 작업 사례",
      locationDisplay: "서울 강서구",
    });

    expect(result.status).toBe("private");
    expect(result.publishedAt).toBeNull();
  });

  it("requires a published case to have a complete checklist and ready public media", () => {
    const published = {
      ...baseCase,
      status: "published" as const,
      publishedAt: "2026-07-22T00:00:00.000Z",
    };
    const hiddenMedia = { ...media(0), public: false };

    expect(MockStoreEnvelopeSchema.safeParse(envelope({ cases: [published], media: [hiddenMedia] })).success).toBe(false);
    expect(
      MockStoreEnvelopeSchema.safeParse(
        envelope({
          cases: [{ ...published, privacyChecklist: { ...checklist, noVehiclePlates: false } }],
        }),
      ).success,
    ).toBe(false);
    expect(MockStoreEnvelopeSchema.safeParse(envelope({ cases: [published] })).success).toBe(true);
  });

  it("enforces 20 files per selection, 69 media per case, and three videos per case", () => {
    expect(MAX_MEDIA_PER_CASE).toBe(69);
    expect(MAX_VIDEOS_PER_CASE).toBe(3);
    expect(MockStoreEnvelopeSchema.safeParse(envelope({ media: Array.from({ length: 70 }, (_, i) => media(i)) })).success).toBe(false);

    const videos = Array.from({ length: 4 }, (_, index) => ({
      id: `video-${index}`,
      caseId: "case-1",
      youtubeVideoId: `abcdefghij${index}`,
      originalUrl: `https://youtu.be/abcdefghij${index}`,
      title: `영상 ${index + 1}`,
      caption: "작업 영상",
      sortOrder: index,
      public: true,
    }));
    expect(MockStoreEnvelopeSchema.safeParse(envelope({ videos })).success).toBe(false);
  });

  it("accepts only JSON-safe storage and forbids persisted session previews", () => {
    expect(MockStoreEnvelopeSchema.safeParse(envelope()).success).toBe(true);
    expect(
      MockStoreEnvelopeSchema.safeParse(
        envelope({ media: [{ ...media(0), sessionPreviewId: "blob:https://example.test/1" }] }),
      ).success,
    ).toBe(false);
    expect(() => JSON.stringify(MockStoreEnvelopeSchema.parse(envelope()))).not.toThrow();
  });
});

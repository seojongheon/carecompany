import { describe, expect, it } from "vitest";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { buildCaseSeo } from "@/features/portfolio/model/case-seo";
import type { PublicCaseDetail } from "@/features/portfolio/model/types";

function detail(overrides: Partial<PublicCaseDetail> = {}): PublicCaseDetail {
  const portfolioCase = SEED_SNAPSHOT.cases.find(({ status }) => status === "published")!;
  const service = SEED_SNAPSHOT.services.find(({ id }) => id === portfolioCase.serviceId)!;
  const media = SEED_SNAPSHOT.media.filter(({ caseId }) => caseId === portfolioCase.id);

  return {
    ...portfolioCase,
    service,
    media,
    videos: SEED_SNAPSHOT.videos.filter(({ caseId }) => caseId === portfolioCase.id),
    coverMedia: media.find(({ cover }) => cover) ?? media[0],
    publicMediaCount: media.filter((item) => item.public).length,
    tags: SEED_SNAPSHOT.tags.filter(({ serviceId }) => serviceId === service.id),
    ...overrides,
  };
}

describe("buildCaseSeo", () => {
  it("creates a readable page-specific title and description from the three work narratives", () => {
    const seo = buildCaseSeo(detail({
      title: "묵은 물때를 정리한 욕실",
      locationDisplay: "천안 서북구",
      spaceType: "아파트 욕실",
      problemDescription: "수전과 타일 틈에 물때가 쌓여 있었습니다.",
      workDescription: "재질에 맞는 도구로 수전과 타일을 구역별로 세척했습니다.",
      resultDescription: "물때를 정리해 욕실을 편안하게 사용할 수 있는 상태로 마쳤습니다.",
    }));

    expect(seo.title).toBe("천안 서북구 화장실 청소 작업 사례 - 묵은 물때를 정리한 욕실");
    expect(seo.description).toBe(
      "천안 서북구 아파트 욕실 화장실 청소 작업 사례입니다. 작업 전에는 수전과 타일 틈에 물때가 쌓여 있었습니다. 진행한 작업은 재질에 맞는 도구로 수전과 타일을 구역별로 세척했습니다. 작업 결과는 물때를 정리해 욕실을 편안하게 사용할 수 있는 상태로 마쳤습니다.",
    );
  });

  it("ignores legacy manual SEO values", () => {
    const seo = buildCaseSeo(detail({
      seoTitle: "수동 SEO 제목",
      seoDescription: "수동 SEO 설명",
    }));

    expect(seo.title).not.toContain("수동 SEO");
    expect(seo.description).not.toContain("수동 SEO");
  });

  it("skips draft placeholders and falls back to the case summary", () => {
    const seo = buildCaseSeo(detail({
      summary: "현장 상태를 확인한 뒤 필요한 범위를 정해 작업했습니다.",
      problemDescription: "작업 전 상태를 입력해 주세요.",
      workDescription: "작업 내용을 입력해 주세요.",
      resultDescription: "작업 결과를 입력해 주세요.",
    }));

    expect(seo.description).toContain("현장 상태를 확인한 뒤 필요한 범위를 정해 작업했습니다.");
    expect(seo.description).not.toContain("입력해 주세요");
  });
});

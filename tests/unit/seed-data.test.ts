import { describe, expect, it } from "vitest";

import { MockStoreEnvelopeSchema, SERVICE_KEYS } from "@/features/portfolio/model/schemas";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";

describe("portfolio seed data", () => {
  it("contains the four canonical PRD services in stable order", () => {
    expect(SEED_SNAPSHOT.services.map(({ key }) => key)).toEqual(SERVICE_KEYS);
    expect(SEED_SNAPSHOT.services.map(({ name }) => name)).toEqual([
      "화장실 청소",
      "에어컨 청소",
      "아파트 유리창 청소",
      "상가 유리창 청소",
    ]);
  });

  it("is valid, immutable, and dense enough for filters and load-more", () => {
    expect(MockStoreEnvelopeSchema.safeParse(SEED_SNAPSHOT).success).toBe(true);
    expect(Object.isFrozen(SEED_SNAPSHOT)).toBe(true);
    expect(Object.isFrozen(SEED_SNAPSHOT.cases)).toBe(true);
    expect(SEED_SNAPSHOT.cases).toHaveLength(20);

    for (const service of SEED_SNAPSHOT.services) {
      const serviceCases = SEED_SNAPSHOT.cases.filter(({ serviceId }) => serviceId === service.id);
      expect(serviceCases.filter(({ status }) => status === "published")).toHaveLength(4);
      expect(serviceCases.filter(({ status }) => status === "private")).toHaveLength(1);
    }
  });

  it("uses realistic safe Korean content without detailed addresses or contact numbers", () => {
    for (const portfolioCase of SEED_SNAPSHOT.cases) {
      expect(portfolioCase.title).toMatch(/[가-힣]/);
      expect(portfolioCase.summary.length).toBeGreaterThan(15);
      expect(portfolioCase.locationDisplay).toMatch(/^(천안|아산)/);
      expect(portfolioCase.locationDisplay).not.toMatch(/\d{2,4}[- .]\d{3,4}[- .]\d{4}|\d+동|\d+호/);
    }
  });

  it("mixes public and private media while keeping every published case customer-ready", () => {
    expect(SEED_SNAPSHOT.media.some((item) => !item.public)).toBe(true);
    expect(SEED_SNAPSHOT.videos.some((item) => !item.public)).toBe(true);

    for (const portfolioCase of SEED_SNAPSHOT.cases.filter(({ status }) => status === "published")) {
      const publicReady = SEED_SNAPSHOT.media.filter(
        (item) => item.caseId === portfolioCase.id && item.public && item.uploadStatus === "ready",
      );
      expect(publicReady.length).toBeGreaterThanOrEqual(3);
      expect(publicReady.some(({ cover }) => cover)).toBe(true);
    }
  });

  it("has deterministic featured ordering with unique ranks", () => {
    const featured = SEED_SNAPSHOT.cases
      .filter(({ featuredRank }) => featuredRank !== null)
      .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));

    expect(featured.map(({ featuredRank }) => featuredRank)).toEqual([1, 2, 3, 4]);
    expect(new Set(featured.map(({ serviceId }) => serviceId)).size).toBe(4);
  });
});

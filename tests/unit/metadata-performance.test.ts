import { describe, expect, it } from "vitest";

import { breadcrumbJsonLd, createPageMetadata, portfolioImageSizes, shouldPrioritizeImage } from "@/lib/metadata";

describe("metadata and media performance", () => {
  it("creates canonical Korean metadata with safe defaults", () => {
    const metadata = createPageMetadata({ title: "화장실 청소", description: "천안·아산 화장실 청소 작업 사례", path: "/services/bathroom" });
    expect(metadata.title).toBe("화장실 청소");
    expect(metadata.alternates?.canonical).toBe("/services/bathroom");
    expect(metadata.openGraph?.locale).toBe("ko_KR");
  });

  it("builds breadcrumb JSON-LD without private fields", () => {
    const data = breadcrumbJsonLd([{ name: "홈", path: "/" }, { name: "작업 사례", path: "/portfolio" }]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(JSON.stringify(data)).not.toContain("localStorage");
  });

  it("defines responsive grid image sizes and only one priority hero", () => {
    expect(portfolioImageSizes).toContain("100vw");
    expect([0, 1, 2].map(shouldPrioritizeImage)).toEqual([true, false, false]);
  });
});

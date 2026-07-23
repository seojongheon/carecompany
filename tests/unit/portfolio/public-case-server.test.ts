import { describe, expect, it, vi } from "vitest";

import { readPublicCaseBySlug } from "@/features/portfolio/repository/public-case-server";

const publishedPayload = {
  case: {
    id: "case-1",
    service_id: "service-1",
    slug: "case-public",
    title: "공개 사례",
    summary: "공개 사례 요약",
    location_display: "천안",
    space_type: "아파트",
    work_date: "2026-07-23",
    display_period: "2026년 7월",
    problem_description: "작업 전",
    work_description: "작업 내용",
    result_description: "작업 결과",
    status: "published",
    featured_rank: null,
    privacy_checklist: {},
    published_at: "2026-07-23T00:00:00Z",
    created_at: "2026-07-23T00:00:00Z",
    updated_at: "2026-07-23T00:00:00Z",
  },
  service: {
    id: "service-1",
    key: "bathroom",
    name: "화장실 청소",
    slug: "bathroom",
    summary: "서비스 요약",
    description: "서비스 설명",
    cover_asset_key: "bathroom",
    sort_order: 1,
    active: true,
  },
  media: [
    {
      id: "media-1",
      case_id: "case-1",
      stage: "after",
      sort_order: 0,
      is_cover: true,
      is_public: true,
      alt_text: "작업 후",
      caption: "",
      width: 1200,
      height: 900,
      mime_type: "image/webp",
      size_bytes: 100,
      upload_status: "ready",
      mock_asset_key: "bathroom-after",
    },
  ],
  videos: [],
  tags: [],
};

describe("public case server reader", () => {
  it("loads and maps a published detail through the public RPC", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: publishedPayload, error: null }),
    };

    const detail = await readPublicCaseBySlug(client, "case-public");

    expect(client.rpc).toHaveBeenCalledWith("get_public_portfolio_case", { case_slug: "case-public" });
    expect(detail).toMatchObject({
      slug: "case-public",
      title: "공개 사례",
      service: { name: "화장실 청소" },
      coverMedia: { id: "media-1" },
      publicMediaCount: 1,
    });
  });

  it("returns null only after the RPC confirms that no public case exists", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    await expect(readPublicCaseBySlug(client, "unknown-case")).resolves.toBeNull();
  });

  it("does not expose a private case even if an authenticated admin can read it", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: { ...publishedPayload, case: { ...publishedPayload.case, status: "private", published_at: null } },
        error: null,
      }),
    };

    await expect(readPublicCaseBySlug(client, "case-private")).resolves.toBeNull();
  });

  it("surfaces RPC failures instead of incorrectly turning them into a 404", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "network failed" } }),
    };

    await expect(readPublicCaseBySlug(client, "case-public")).rejects.toThrow("network failed");
  });
});

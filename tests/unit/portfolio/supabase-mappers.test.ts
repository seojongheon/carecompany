import { describe, expect, it } from "vitest";

import { mapPortfolioCaseRow, mapServiceRow } from "@/features/portfolio/repository/supabase-mappers";

describe("Supabase portfolio mappers", () => {
  it("maps trusted snake-case service rows into the existing domain", () => {
    expect(mapServiceRow({ id: "service-1", key: "bathroom", name: "화장실 청소", slug: "bathroom", summary: "요약", description: "설명", cover_asset_key: "bathroom", sort_order: 1, active: true })).toEqual({ id: "service-1", key: "bathroom", name: "화장실 청소", slug: "bathroom", summary: "요약", description: "설명", coverAssetKey: "bathroom", sortOrder: 1, active: true });
  });

  it("normalizes nullable database values without changing publication state", () => {
    expect(mapPortfolioCaseRow({
      id: "case-1", service_id: "service-1", slug: "safe-case", title: "사례", summary: "", location_display: "천안", space_type: "", work_date: null, display_period: "", problem_description: "", work_description: "", result_description: "", seo_title: null, seo_description: null, status: "private", featured_rank: null, privacy_checklist: {}, published_at: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    })).toMatchObject({ id: "case-1", serviceId: "service-1", workDate: "", status: "private", publishedAt: null, privacyChecklist: { noIdentifiablePeople: false, hasPublicReadyMedia: false } });
  });
});

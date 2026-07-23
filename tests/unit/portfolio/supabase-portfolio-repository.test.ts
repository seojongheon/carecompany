import { describe, expect, it, vi } from "vitest";

import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import type { MockStoreEnvelope } from "@/features/portfolio/model/types";

const snapshot: MockStoreEnvelope = {
  schemaVersion: 1,
  savedAt: "2026-01-01T00:00:00Z",
  services: [{ id: "service-1", key: "bathroom", name: "화장실", slug: "bathroom", summary: "", description: "", coverAssetKey: "bathroom", sortOrder: 1, active: true }],
  cases: [], media: [], videos: [], tags: [], caseTagIds: {},
};

describe("SupabasePortfolioRepository", () => {
  it("hydrates its synchronous view from the remote gateway and notifies subscribers", async () => {
    const remote = { loadSnapshot: vi.fn().mockResolvedValue(snapshot) };
    const repository = new SupabasePortfolioRepository(remote as never);
    const listener = vi.fn();
    repository.subscribe(listener);

    await repository.hydrate();

    expect(repository.listServices()).toHaveLength(1);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("persists a private draft through the gateway before refreshing", async () => {
    const remote = {
      loadSnapshot: vi.fn().mockResolvedValue(snapshot),
      createDraft: vi.fn().mockResolvedValue({ id: "case-1" }),
    };
    const repository = new SupabasePortfolioRepository(remote as never);

    await repository.createDraft({ serviceId: "service-1", title: "새 사례", locationDisplay: "천안" });

    expect(remote.createDraft).toHaveBeenCalledWith(expect.objectContaining({ status: "private" }));
    expect(remote.createDraft.mock.calls[0][0]).not.toHaveProperty("slug");
    expect(remote.loadSnapshot).toHaveBeenCalledOnce();
  });
});

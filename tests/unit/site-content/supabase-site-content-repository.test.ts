import { describe, expect, it, vi } from "vitest";

import { SupabaseSiteContentGateway, SupabaseSiteContentRepository } from "@/features/site-content/repository/supabase-site-content-repository";
import { SITE_CONTENT_SEED_SNAPSHOT } from "@/features/site-content/model/seed";

describe("SupabaseSiteContentRepository", () => {
  it("hydrates published and draft content from the remote boundary", async () => {
    const remote = { loadSnapshot: vi.fn().mockResolvedValue(SITE_CONTENT_SEED_SNAPSHOT) };
    const repository = new SupabaseSiteContentRepository(remote as never);
    const listener = vi.fn();
    repository.subscribe(listener);
    await repository.hydrate();
    expect(repository.getSnapshot().published.home.title).toContain("청소");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("keeps the snapshot reference stable until remote data changes", async () => {
    const remote = { loadSnapshot: vi.fn().mockResolvedValue(SITE_CONTENT_SEED_SNAPSHOT) };
    const repository = new SupabaseSiteContentRepository(remote as never);
    expect(repository.getSnapshot()).toBe(repository.getSnapshot());
    await repository.hydrate();
    expect(repository.getSnapshot()).toBe(repository.getSnapshot());
  });

  it("uses the public RPC when an anonymous visitor cannot read administrator tables", async () => {
    const publicContent = { ...SITE_CONTENT_SEED_SNAPSHOT.published, pricingLead: "원격 공개 가격 안내" };
    const client = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: "42501", message: "permission denied" } }) })),
          order: vi.fn(() => table === "site_content_versions"
            ? { limit: vi.fn().mockResolvedValue({ data: [], error: null }) }
            : Promise.resolve({ data: [], error: null })),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({ data: publicContent, error: null }),
    };
    const gateway = new SupabaseSiteContentGateway(client as never);
    const snapshot = await gateway.loadSnapshot();
    expect(snapshot.published.pricingLead).toBe("원격 공개 가격 안내");
    expect(snapshot.versions).toEqual([]);
    expect(client.from).not.toHaveBeenCalled();
    expect(client.rpc).toHaveBeenCalledWith("get_published_site_content");
  });

  it("keeps edits local until saveDraft and publishes through the trusted RPC", async () => {
    const remote = {
      loadSnapshot: vi.fn().mockResolvedValue(SITE_CONTENT_SEED_SNAPSHOT),
      saveDraft: vi.fn().mockResolvedValue(undefined),
      publish: vi.fn().mockResolvedValue(undefined),
    };
    const repository = new SupabaseSiteContentRepository(remote as never);
    repository.updateDraft({ pricingLead: "새 안내" });
    expect(remote.saveDraft).not.toHaveBeenCalled();
    await repository.saveDraft();
    await repository.publish();
    expect(remote.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ pricingLead: "새 안내" }));
    expect(remote.publish).toHaveBeenCalledOnce();
  });
});

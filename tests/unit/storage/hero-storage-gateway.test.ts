import { describe, expect, it, vi } from "vitest";

import { createHeroStorageGateway } from "@/features/site-content/storage/hero-storage-gateway";

const jpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xdb])], "hero.jpg", { type: "image/jpeg" });

describe("Hero Storage gateway", () => {
  it("fails closed without making a Storage request when disabled", async () => {
    const client = { storage: { from: vi.fn() }, rpc: vi.fn() };
    const gateway = createHeroStorageGateway({ enabled: false, client: client as never });

    await expect(gateway.uploadHeroImage(jpeg())).resolves.toEqual({
      ok: false,
      code: "storage_disabled",
    });
    expect(client.storage.from).not.toHaveBeenCalled();
  });

  it("stores a reviewed WebP in the private landing bucket", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const client = { storage: { from: vi.fn().mockReturnValue({ upload }) }, rpc: vi.fn() };
    const reviewed = new File(["reviewed"], "hero.webp", { type: "image/webp" });
    const gateway = createHeroStorageGateway({
      enabled: true,
      client: client as never,
      createReviewedFile: vi.fn().mockResolvedValue(reviewed),
    });

    await expect(gateway.uploadHeroImage(jpeg())).resolves.toMatchObject({
      ok: true,
      path: expect.stringMatching(/^hero\/[0-9a-f-]+\.webp$/),
    });
    expect(client.storage.from).toHaveBeenCalledWith("landing-hero");
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^hero\/[0-9a-f-]+\.webp$/), reviewed, {
      upsert: false,
      contentType: "image/webp",
    });
  });

  it("removes an old draft object only after atomically claiming a tombstone", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const client = {
      rpc: vi.fn()
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: null, error: null }),
      storage: { from: vi.fn().mockReturnValue({ remove }) },
    };
    const gateway = createHeroStorageGateway({ enabled: true, client: client as never });

    await expect(gateway.removeIfUnreferenced("hero/old.webp")).resolves.toEqual({ ok: true, removed: true });
    expect(client.rpc).toHaveBeenNthCalledWith(1, "claim_landing_hero_cleanup", { storage_path: "hero/old.webp" });
    expect(remove).toHaveBeenCalledWith(["hero/old.webp"]);
    expect(client.rpc).toHaveBeenNthCalledWith(2, "finish_landing_hero_cleanup", { storage_path: "hero/old.webp" });
  });

  it("keeps hero objects referenced by draft, published content, or version history", async () => {
    const remove = vi.fn();
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
      storage: { from: vi.fn().mockReturnValue({ remove }) },
    };
    const gateway = createHeroStorageGateway({ enabled: true, client: client as never });

    await expect(gateway.removeIfUnreferenced("hero/published.webp")).resolves.toEqual({ ok: true, removed: false });
    expect(remove).not.toHaveBeenCalled();
  });

  it("keeps the tombstone queued when Storage deletion fails", async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: "delete failed" } });
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      storage: { from: vi.fn().mockReturnValue({ remove }) },
    };
    const gateway = createHeroStorageGateway({ enabled: true, client: client as never });

    await expect(gateway.removeIfUnreferenced("hero/retry.webp")).resolves.toEqual({ ok: false, code: "remove_failed" });
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it("retries durable tombstones and marks successful cleanup complete", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const client = {
      rpc: vi.fn()
        .mockResolvedValueOnce({ data: ["hero/retry.webp"], error: null })
        .mockResolvedValueOnce({ data: null, error: null }),
      storage: { from: vi.fn().mockReturnValue({ remove }) },
    };
    const gateway = createHeroStorageGateway({ enabled: true, client: client as never });

    await expect(gateway.retryPendingCleanup()).resolves.toEqual({ ok: true, retried: 1 });
    expect(remove).toHaveBeenCalledWith(["hero/retry.webp"]);
    expect(client.rpc).toHaveBeenNthCalledWith(2, "finish_landing_hero_cleanup", { storage_path: "hero/retry.webp" });
  });
});

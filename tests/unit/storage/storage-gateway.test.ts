import { describe, expect, it, vi } from "vitest";

import { createStorageGateway } from "@/features/portfolio/storage/storage-gateway";

const files = (count: number) => Array.from({ length: count }, (_, index) => new File(["x"], `photo-${index}.jpg`, { type: "image/jpeg" }));

describe("Storage gateway", () => {
  it("fails closed without making a Storage request when disabled", async () => {
    const upload = vi.fn();
    const client = { storage: { from: vi.fn().mockReturnValue({ upload }) } };
    const gateway = createStorageGateway({ enabled: false, client: client as never });
    await expect(gateway.uploadCaseFiles("case-1", files(1))).resolves.toEqual({ ok: false, code: "storage_disabled" });
    expect(client.storage.from).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects more than 20 files before any upload", async () => {
    const client = { storage: { from: vi.fn() } };
    const gateway = createStorageGateway({ enabled: true, client: client as never });
    await expect(gateway.uploadCaseFiles("case-1", files(21))).resolves.toEqual({ ok: false, code: "selection_limit" });
    expect(client.storage.from).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";

import { createStorageGateway } from "@/features/portfolio/storage/storage-gateway";
import { hasSupportedImageSignature } from "@/features/uploads/model/create-reviewed-webp";

const files = (count: number) => Array.from({ length: count }, (_, index) => new File([
  new Uint8Array([0xff, 0xd8, 0xff, 0xdb]),
], `photo-${index}.jpg`, { type: "image/jpeg" }));

describe("Storage gateway", () => {
  it("rejects a file whose bytes do not match its declared image type", async () => {
    await expect(hasSupportedImageSignature(
      new File(["not-an-image"], "fake.jpg", { type: "image/jpeg" }),
    )).resolves.toBe(false);
  });

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

  it("rejects an empty file at the Storage boundary", async () => {
    const client = { storage: { from: vi.fn() } };
    const gateway = createStorageGateway({ enabled: true, client: client as never });

    await expect(gateway.uploadCaseFiles("case-1", [
      new File([], "empty.jpg", { type: "image/jpeg" }),
    ])).resolves.toEqual({ ok: false, code: "invalid_file" });
    expect(client.storage.from).not.toHaveBeenCalled();
  });

  it("stores an original privately and a re-encoded review file separately", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const client = { storage: { from: vi.fn().mockReturnValue({ upload, remove: vi.fn().mockResolvedValue({ error: null }) }) } };
    const reviewFile = new File(["review"], "photo.webp", { type: "image/webp" });
    const gateway = createStorageGateway({ enabled: true, client: client as never, createReviewedFile: vi.fn().mockResolvedValue(reviewFile) });

    const result = await gateway.uploadCaseFiles("case-1", files(1));

    expect(result).toMatchObject({ ok: true, files: [{ originalPath: expect.stringMatching(/^case-1\//), reviewedPath: expect.stringMatching(/^case-1\//), mimeType: "image/webp" }] });
    expect(client.storage.from).toHaveBeenNthCalledWith(1, "case-originals");
    expect(client.storage.from).toHaveBeenNthCalledWith(2, "case-reviewed-public");
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it("removes the original when the reviewed copy fails to upload", async () => {
    const originalUpload = vi.fn().mockResolvedValue({ error: null });
    const removeOriginals = vi.fn().mockResolvedValue({ error: null });
    const reviewedUpload = vi.fn().mockResolvedValue({ error: { message: "review failed" } });
    const client = {
      storage: {
        from: vi.fn((bucket: string) => bucket === "case-originals"
          ? { upload: originalUpload, remove: removeOriginals }
          : { upload: reviewedUpload, remove: vi.fn() }),
      },
    };
    const gateway = createStorageGateway({
      enabled: true,
      client: client as never,
      createReviewedFile: vi.fn().mockResolvedValue(new File(["review"], "photo.webp", { type: "image/webp" })),
    });

    await expect(gateway.uploadCaseFiles("case-1", files(1))).resolves.toEqual({ ok: false, code: "upload_failed" });
    expect(removeOriginals).toHaveBeenCalledWith([expect.stringMatching(/^case-1\//)]);
  });

  it("rolls back every object created by a multi-file upload when a later file fails", async () => {
    const originalUpload = vi.fn().mockResolvedValue({ error: null });
    const reviewedUpload = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "review failed" } });
    const removeOriginals = vi.fn().mockResolvedValue({ error: null });
    const removeReviewed = vi.fn().mockResolvedValue({ error: null });
    const client = {
      storage: {
        from: vi.fn((bucket: string) => bucket === "case-originals"
          ? { upload: originalUpload, remove: removeOriginals }
          : { upload: reviewedUpload, remove: removeReviewed }),
      },
    };
    const gateway = createStorageGateway({
      enabled: true,
      client: client as never,
      createReviewedFile: vi.fn().mockImplementation((file: File) => Promise.resolve(new File(["review"], `${file.name}.webp`, { type: "image/webp" }))),
    });

    await expect(gateway.uploadCaseFiles("case-1", files(2))).resolves.toEqual({ ok: false, code: "upload_failed" });
    expect(removeOriginals).toHaveBeenCalledWith([
      expect.stringMatching(/^case-1\//),
      expect.stringMatching(/^case-1\//),
    ]);
    expect(removeReviewed).toHaveBeenCalledWith([expect.stringMatching(/^case-1\//)]);
  });

  it("reports rollback failure with the paths that require cleanup", async () => {
    const originalUpload = vi.fn().mockResolvedValue({ error: null });
    const reviewedUpload = vi.fn().mockResolvedValue({ error: { message: "review failed" } });
    const removeOriginals = vi.fn().mockResolvedValue({ error: { message: "cleanup failed" } });
    const client = {
      storage: {
        from: vi.fn((bucket: string) => bucket === "case-originals"
          ? { upload: originalUpload, remove: removeOriginals }
          : { upload: reviewedUpload, remove: vi.fn().mockResolvedValue({ error: null }) }),
      },
    };
    const gateway = createStorageGateway({
      enabled: true,
      client: client as never,
      createReviewedFile: vi.fn().mockResolvedValue(new File(["review"], "photo.webp", { type: "image/webp" })),
    });

    await expect(gateway.uploadCaseFiles("case-1", files(1))).resolves.toMatchObject({
      ok: false,
      code: "cleanup_required",
      files: [{ originalPath: expect.stringMatching(/^case-1\//), reviewedPath: "" }],
    });
  });

  it("reports cleanup failure so the caller can keep media references visible", async () => {
    const removeOriginals = vi.fn().mockResolvedValue({ error: null });
    const removeReviewed = vi.fn().mockResolvedValue({ error: { message: "delete failed" } });
    const client = {
      storage: {
        from: vi.fn((bucket: string) => bucket === "case-originals"
          ? { remove: removeOriginals }
          : { remove: removeReviewed }),
      },
    };
    const gateway = createStorageGateway({ enabled: true, client: client as never });

    await expect(gateway.removeCaseFiles([{
      originalPath: "case-1/original.jpg",
      reviewedPath: "case-1/review.webp",
    }])).resolves.toEqual({ ok: false, code: "remove_failed" });
  });
});

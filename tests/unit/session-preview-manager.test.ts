import { describe, expect, it, vi } from "vitest";

import { SessionPreviewManager } from "@/features/uploads/model/session-preview-manager";
import { runSimulatedUpload } from "@/features/uploads/model/simulated-upload";
import { validateFileSelection } from "@/features/uploads/model/upload-constraints";

function file(name: string, type = "image/jpeg", size = 100) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("session upload foundation", () => {
  it("blocks unsupported MIME, oversized files, 21-file selections, and a 70th case item", () => {
    expect(validateFileSelection([file("note.txt", "text/plain")], 0).issues[0].code).toBe("unsupported-type");
    expect(validateFileSelection([file("huge.jpg", "image/jpeg", 20 * 1024 * 1024 + 1)], 0).issues[0].code).toBe("file-too-large");
    expect(validateFileSelection(Array.from({ length: 21 }, (_, i) => file(`${i}.jpg`)), 0).issues[0].code).toBe("selection-limit");
    expect(validateFileSelection([file("70.jpg")], 69).issues[0].code).toBe("case-limit");
    expect(validateFileSelection([file("ok.webp", "image/webp")], 68).accepted).toHaveLength(1);
  });

  it("owns session-only object URLs and revokes them on remove and reset", () => {
    const createObjectURL = vi.fn((selected: File) => `blob:test/${selected.name}`);
    const revokeObjectURL = vi.fn();
    const manager = new SessionPreviewManager({ createObjectURL, revokeObjectURL });
    const first = manager.add(file("first.jpg"));
    manager.add(file("second.jpg"));

    expect(first.objectUrl).toBe("blob:test/first.jpg");
    expect(manager.list()).toHaveLength(2);
    manager.remove(first.id);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test/first.jpg");
    manager.reset();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test/second.jpg");
    expect(manager.list()).toEqual([]);
  });

  it("reports incremental progress, keeps successes, and retries only failed items", async () => {
    vi.useFakeTimers();
    const progress: number[] = [];
    const success = runSimulatedUpload({ id: "ok", shouldFail: false, onProgress: (value) => progress.push(value), intervalMs: 10 });
    await vi.runAllTimersAsync();
    await expect(success).resolves.toMatchObject({ id: "ok", status: "ready", progress: 100 });
    expect(progress.length).toBeGreaterThan(2);

    const failed = runSimulatedUpload({ id: "bad", shouldFail: true, onProgress: () => undefined, intervalMs: 10 });
    await vi.runAllTimersAsync();
    await expect(failed).resolves.toMatchObject({ id: "bad", status: "failed" });

    const retry = runSimulatedUpload({ id: "bad", shouldFail: false, onProgress: () => undefined, intervalMs: 10 });
    await vi.runAllTimersAsync();
    await expect(retry).resolves.toMatchObject({ id: "bad", status: "ready", progress: 100 });
    vi.useRealTimers();
  });
});

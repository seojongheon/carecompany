import { describe, expect, it } from "vitest";

import { createSerialTaskQueue } from "@/features/uploads/model/serial-task-queue";

describe("createSerialTaskQueue", () => {
  it("does not start the next media persistence task until the previous task finishes", async () => {
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const enqueue = createSerialTaskQueue();

    const first = enqueue(async () => {
      events.push("first:start");
      await firstGate;
      events.push("first:end");
    });
    const second = enqueue(async () => {
      events.push("second:start");
      events.push("second:end");
    });

    await Promise.resolve();
    expect(events).toEqual(["first:start"]);

    releaseFirst();
    await Promise.all([first, second]);

    expect(events).toEqual(["first:start", "first:end", "second:start", "second:end"]);
  });

  it("continues with later uploads after one persistence task fails", async () => {
    const enqueue = createSerialTaskQueue();
    const failed = enqueue(async () => { throw new Error("failed"); });
    const recovered = enqueue(async () => "saved");

    await expect(failed).rejects.toThrow("failed");
    await expect(recovered).resolves.toBe("saved");
  });
});

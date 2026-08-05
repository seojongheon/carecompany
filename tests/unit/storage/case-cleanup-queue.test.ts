import { beforeEach, describe, expect, it } from "vitest";

import {
  enqueuePendingCaseCleanup,
  readPendingCaseCleanup,
  resolvePendingCaseCleanup,
} from "@/features/portfolio/storage/case-cleanup-queue";

describe("case Storage cleanup queue", () => {
  beforeEach(() => localStorage.clear());

  it("persists, deduplicates, and resolves cleanup work across component lifetimes", () => {
    const first = { originalPath: "case/original.jpg", reviewedPath: "case/review.webp" };
    const second = { originalPath: "case/second.jpg", reviewedPath: "case/second.webp" };

    enqueuePendingCaseCleanup([first]);
    enqueuePendingCaseCleanup([first, second]);

    expect(readPendingCaseCleanup()).toEqual([first, second]);
    expect(resolvePendingCaseCleanup([first])).toEqual([second]);
    expect(readPendingCaseCleanup()).toEqual([second]);
  });
});

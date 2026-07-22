import { describe, expect, it } from "vitest";

import { decodePortfolioCursor, encodePortfolioCursor } from "@/features/portfolio/model/cursor";
import { portfolioPath, servicePath, withPortfolioQuery } from "@/lib/routes";
import { parseYouTubeUrl } from "@/lib/youtube";

describe("YouTube and route helpers", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=12", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("parses supported YouTube URL %s", (url, videoId) => {
    expect(parseYouTubeUrl(url)?.videoId).toBe(videoId);
  });

  it.each([
    "https://vimeo.com/123",
    "https://youtube.com/embed/dQw4w9WgXcQ",
    "https://youtube.com/watch?v=short",
    "not-a-url",
  ])("rejects unsupported URL %s", (url) => {
    expect(parseYouTubeUrl(url)).toBeNull();
  });

  it("builds canonical service and case paths", () => {
    expect(servicePath("apartment-window")).toBe("/services/apartment-window");
    expect(portfolioPath("bright-window-case")).toBe("/portfolio/bright-window-case");
  });

  it("sorts and omits empty query values deterministically", () => {
    expect(withPortfolioQuery("/portfolio", {
      service: "bathroom",
      tags: ["scope", "home"],
      cursor: undefined,
    })).toBe("/portfolio?service=bathroom&tags=home%2Cscope");
  });

  it("round-trips a stable cursor and rejects malformed values", () => {
    const tuple = { featuredRank: null, publishedAt: "2026-06-04T09:00:00.000Z", id: "case-4" };
    const encoded = encodePortfolioCursor(tuple);
    expect(decodePortfolioCursor(encoded)).toEqual(tuple);
    expect(decodePortfolioCursor("broken")).toBeNull();
  });
});

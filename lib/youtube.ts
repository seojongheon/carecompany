export interface ParsedYouTubeUrl {
  videoId: string;
  canonicalUrl: string;
  kind: "video" | "short";
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeUrl(value: string): ParsedYouTubeUrl | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;
    let kind: ParsedYouTubeUrl["kind"] = "video";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" && url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (host === "youtube.com" && url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] ?? null;
      kind = "short";
    }

    if (!videoId || !VIDEO_ID.test(videoId)) return null;
    return {
      videoId,
      canonicalUrl: kind === "short"
        ? `https://www.youtube.com/shorts/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`,
      kind,
    };
  } catch {
    return null;
  }
}


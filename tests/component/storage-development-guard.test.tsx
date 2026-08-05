import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_ASSETS, SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { useCaseMediaUrls } from "@/features/portfolio/storage/use-case-media-urls";

const storageMocks = vi.hoisted(() => ({
  from: vi.fn(),
  createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    storage: {
      from: storageMocks.from,
    },
  }),
}));

describe("development Storage guard", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    storageMocks.from.mockReset();
    storageMocks.from.mockReturnValue({ createSignedUrls: storageMocks.createSignedUrls });
    storageMocks.createSignedUrls.mockClear();
  });

  it("does not request signed image URLs in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const media = {
      ...SEED_SNAPSHOT.media[0],
      storagePath: "case-1/reviewed.webp",
      mockAssetKey: "",
    };

    const { result } = renderHook(() => useCaseMediaUrls([media], "aircon"));

    await waitFor(() => expect(result.current).toEqual({ [media.id]: MOCK_ASSETS.aircon }));
    expect(storageMocks.from).not.toHaveBeenCalled();
    expect(storageMocks.createSignedUrls).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import ServiceDetailPage, { generateMetadata } from "@/app/(site)/services/[service]/page";
import { getPublishedServices } from "@/features/site-content/server/public-content";

vi.mock("@/features/site-content/server/public-content", () => ({ getPublishedServices: vi.fn() }));
vi.mock("@/features/site-content/ui/published-service", () => ({ PublishedService: () => null }));

beforeEach(() => vi.resetAllMocks());

describe("published service route", () => {
  it("does not serve a service after its published active flag is disabled", async () => {
    vi.mocked(getPublishedServices).mockResolvedValue([
      { key: "bathroom", active: false, name: "화장실", summary: "서비스 안내" },
    ] as Awaited<ReturnType<typeof getPublishedServices>>);
    await expect(ServiceDetailPage({ params: Promise.resolve({ service: "bathroom" }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("does not emit public metadata for a disabled service", async () => {
    vi.mocked(getPublishedServices).mockResolvedValue([
      { key: "bathroom", active: false, name: "화장실", summary: "서비스 안내" },
    ] as Awaited<ReturnType<typeof getPublishedServices>>);
    expect(await generateMetadata({ params: Promise.resolve({ service: "bathroom" }) })).toEqual({});
  });
});

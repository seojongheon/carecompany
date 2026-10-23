import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { CASE_IMAGE_GUIDANCE, LANDING_HERO_IMAGE_GUIDANCE } from "@/features/uploads/model/image-upload-guidance";
import { ImageDropzone } from "@/features/uploads/ui/image-dropzone";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { UploadPanel } from "@/features/uploads/ui/upload-panel";
import { LandingHeroImageManager } from "@/features/site-content/ui/landing-hero-image-manager";
import { SITE_CONTENT_SEED_SNAPSHOT } from "@/features/site-content/model/seed";
import { LocalStorageSiteContentRepository } from "@/features/site-content/repository/local-storage-site-content-repository";
import { SiteContentProvider } from "@/features/site-content/repository/site-content-provider";
import { HomeSections } from "@/components/site/home-sections";
import { AdminPublishingWorkspace } from "@/features/portfolio/ui/admin-publishing-workspace";
import { SupabasePortfolioRepository } from "@/features/portfolio/repository/supabase-portfolio-repository";
import type { PortfolioRepository } from "@/features/portfolio/repository/portfolio-repository";
import { PhotoManager } from "@/features/uploads/ui/photo-manager";

const storageGatewayMocks = vi.hoisted(() => ({
  uploadCaseFiles: vi.fn(),
  removeCaseFiles: vi.fn(),
}));
const heroStorageGatewayMocks = vi.hoisted(() => ({
  uploadHeroImage: vi.fn(),
  removeIfUnreferenced: vi.fn(),
  retryPendingCleanup: vi.fn().mockResolvedValue({ ok: true, retried: 0 }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({}),
}));

vi.mock("@/features/portfolio/storage/storage-gateway", () => ({
  createStorageGateway: () => storageGatewayMocks,
}));

vi.mock("@/features/site-content/storage/hero-storage-gateway", () => ({
  createHeroStorageGateway: () => heroStorageGatewayMocks,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  storageGatewayMocks.uploadCaseFiles.mockReset();
  storageGatewayMocks.removeCaseFiles.mockReset();
  heroStorageGatewayMocks.uploadHeroImage.mockReset();
  heroStorageGatewayMocks.removeIfUnreferenced.mockReset();
  heroStorageGatewayMocks.retryPendingCleanup.mockReset();
  heroStorageGatewayMocks.retryPendingCleanup.mockResolvedValue({ ok: true, retried: 0 });
});

describe("ImageDropzone", () => {
  it("keeps enabled development uploads in the current session without Supabase persistence", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "development");
    const user = userEvent.setup();
    const replaceMedia = vi.fn();
    const repository = new SupabasePortfolioRepository({
      loadSnapshot: vi.fn().mockResolvedValue(SEED_SNAPSHOT),
      replaceMedia,
    } as never);

    render(<PortfolioProvider repository={repository}><UploadPanel caseId={SEED_SNAPSHOT.cases[0].id} stage="after" /></PortfolioProvider>);

    expect(screen.getByText(/개발 목업에서는 Supabase Storage를 사용하지 않습니다/)).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText("작업 후 사진 파일 선택"),
      new File(["preview"], "development-preview.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByText("완료", {}, { timeout: 1500 })).toBeInTheDocument();
    expect(replaceMedia).not.toHaveBeenCalled();
  });

  it("passes locally selected case images through the shared upload flow", async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    const file = new File(["photo"], "case.webp", { type: "image/webp" });
    render(<ImageDropzone guidance={CASE_IMAGE_GUIDANCE} multiple onFiles={onFiles} />);

    await user.upload(screen.getByLabelText("사례 사진 파일 선택"), file);

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(screen.getByText("권장 1600 × 1200px · 4:3 · JPG 또는 WebP")).toBeInTheDocument();
  });

  it("passes dropped hero images through the same flow and shows the hero guidance", () => {
    const onFiles = vi.fn();
    const file = new File(["hero"], "hero.jpg", { type: "image/jpeg" });
    render(<ImageDropzone guidance={LANDING_HERO_IMAGE_GUIDANCE} onFiles={onFiles} />);

    fireEvent.drop(screen.getByTestId("landing-hero-image-dropzone"), { dataTransfer: { files: [file] } });

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(screen.getByText("권장 1920 × 1080px · 16:9 · JPG 또는 WebP")).toBeInTheDocument();
  });

  it("adds dropped case images through the same panel used for local file selection", async () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    const file = new File(["case"], "dropped-case.jpg", { type: "image/jpeg" });
    render(<PortfolioProvider repository={repository}><UploadPanel caseId={draft.id} stage="after" /></PortfolioProvider>);

    fireEvent.drop(screen.getByTestId("case-image-after-dropzone"), { dataTransfer: { files: [file] } });

    expect(await screen.findByText("dropped-case.jpg")).toBeInTheDocument();
    expect(screen.getByText("권장 1600 × 1200px · 4:3 · JPG 또는 WebP")).toBeInTheDocument();
  });

  it("separates before and after uploads and persists the selected stage", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    render(<PortfolioProvider repository={repository}><AdminPublishingWorkspace caseId={draft.id} /></PortfolioProvider>);

    await user.upload(screen.getByLabelText("작업 전 사진 파일 선택"), new File(["before"], "before.jpg", { type: "image/jpeg" }));
    await user.upload(screen.getByLabelText("작업 후 사진 파일 선택"), new File(["after"], "after.jpg", { type: "image/jpeg" }));

    expect(await screen.findByText("before.jpg")).toBeInTheDocument();
    expect(await screen.findByText("after.jpg")).toBeInTheDocument();
    await waitFor(() => {
      expect(repository.getAdminCaseById(draft.id)?.media.some(({ altText, stage }) => altText.includes("before.jpg") && stage === "before")).toBe(true);
      expect(repository.getAdminCaseById(draft.id)?.media.some(({ altText, stage }) => altText.includes("after.jpg") && stage === "after")).toBe(true);
    });
  });

  it("preserves every photo when multiple persistence requests finish concurrently", async () => {
    const user = userEvent.setup();
    const base = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const repository = new Proxy(base, {
      get(target, property) {
        if (property === "setCaseMedia") {
          return async (...args: Parameters<PortfolioRepository["setCaseMedia"]>) => {
            await new Promise((resolve) => window.setTimeout(resolve, 25));
            return target.setCaseMedia(...args);
          };
        }
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as PortfolioRepository;
    const draft = repository.listAdminCases({ status: "private" })[0];
    const beforeCount = repository.getAdminCaseById(draft.id)?.media.length ?? 0;
    render(<PortfolioProvider repository={repository}><UploadPanel caseId={draft.id} stage="after" /></PortfolioProvider>);

    await user.upload(screen.getByLabelText("작업 후 사진 파일 선택"), [
      new File(["one"], "one.jpg", { type: "image/jpeg" }),
      new File(["two"], "two.jpg", { type: "image/jpeg" }),
    ]);

    await waitFor(() => expect(repository.getAdminCaseById(draft.id)?.media).toHaveLength(beforeCount + 2), { timeout: 2000 });
  });

  it("rolls back uploaded objects and reports failure when the media reference cannot be saved", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "production");
    storageGatewayMocks.uploadCaseFiles.mockResolvedValue({
      ok: true,
      files: [{
        originalPath: `${SEED_SNAPSHOT.cases[0].id}/original.jpg`,
        reviewedPath: `${SEED_SNAPSHOT.cases[0].id}/review.webp`,
        mimeType: "image/webp",
        sizeBytes: 10,
      }],
    });
    storageGatewayMocks.removeCaseFiles.mockResolvedValue({ ok: true });
    const repository = new SupabasePortfolioRepository({
      loadSnapshot: vi.fn().mockResolvedValue(SEED_SNAPSHOT),
      replaceMedia: vi.fn().mockRejectedValue(new Error("database failed")),
    } as never);
    const user = userEvent.setup();
    render(<PortfolioProvider repository={repository}><UploadPanel caseId={SEED_SNAPSHOT.cases[0].id} stage="after" /></PortfolioProvider>);

    await user.upload(screen.getByLabelText("작업 후 사진 파일 선택"), new File(["photo"], "failure.jpg", { type: "image/jpeg" }));

    expect(await screen.findByText("사진 정보를 저장하지 못해 업로드한 파일을 정리했습니다.")).toBeInTheDocument();
    expect(storageGatewayMocks.removeCaseFiles).toHaveBeenCalledWith([{
      originalPath: `${SEED_SNAPSHOT.cases[0].id}/original.jpg`,
      reviewedPath: `${SEED_SNAPSHOT.cases[0].id}/review.webp`,
    }]);
  });

  it("keeps every storage object and input when draft removal fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "production");
    storageGatewayMocks.removeCaseFiles.mockResolvedValue({ ok: true });
    const events: string[] = [];
    const replaceMedia = vi.fn().mockImplementation(async () => { events.push("database"); throw new Error("database rejected"); });
    storageGatewayMocks.removeCaseFiles.mockImplementation(async () => { events.push("storage"); return { ok: true }; });
    const repository = new SupabasePortfolioRepository({
      loadSnapshot: vi.fn().mockResolvedValue(SEED_SNAPSHOT),
      replaceMedia,
    } as never);
    const user = userEvent.setup();
    render(<PortfolioProvider repository={repository}><PhotoManager caseId={SEED_SNAPSHOT.cases[0].id} /></PortfolioProvider>);

    const [checkbox] = await screen.findAllByRole("checkbox", { name: /사진 선택/ });
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: /선택 삭제/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("초안에서 사진을 제거하지 못했습니다");
    expect(replaceMedia).toHaveBeenCalled();
    expect(storageGatewayMocks.removeCaseFiles).not.toHaveBeenCalled();
    expect(events).toEqual(["database"]);
    expect(screen.getAllByRole("checkbox", { name: /사진 선택/ })).toHaveLength(SEED_SNAPSHOT.media.filter(({ caseId }) => caseId === SEED_SNAPSHOT.cases[0].id).length);
  });

  it("does not retry queued Storage deletion while the emergency flag is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED", "false");
    vi.stubEnv("NODE_ENV", "production");
    localStorage.setItem("portfolio:pending-case-storage-cleanup:v1", JSON.stringify([{
      originalPath: "case-1/original.jpg",
      reviewedPath: "case-1/review.webp",
    }]));
    const repository = new SupabasePortfolioRepository({
      loadSnapshot: vi.fn().mockResolvedValue(SEED_SNAPSHOT),
    } as never);
    render(<PortfolioProvider repository={repository}><PhotoManager caseId={SEED_SNAPSHOT.cases[0].id} /></PortfolioProvider>);

    await screen.findAllByRole("checkbox", { name: /사진 선택/ });
    expect(screen.queryByRole("button", { name: "Storage 정리 재시도" })).not.toBeInTheDocument();

    expect(storageGatewayMocks.removeCaseFiles).not.toHaveBeenCalled();
    expect(localStorage.getItem("portfolio:pending-case-storage-cleanup:v1")).toContain("case-1/original.jpg");
  });

  it("previews a locally selected landing hero image and preserves its alternative text in the draft", async () => {
    const user = userEvent.setup();
    const file = new File(["hero"], "landing.webp", { type: "image/webp" });
    function Harness() {
      const [home, setHome] = useState(structuredClone(SITE_CONTENT_SEED_SNAPSHOT.draft.home));
      return <LandingHeroImageManager home={home} onChange={setHome} />;
    }
    render(<Harness />);

    await user.upload(screen.getByLabelText("랜딩 대표이미지 파일 선택"), file);
    await user.clear(screen.getByLabelText("대표 이미지 대체 텍스트"));
    await user.type(screen.getByLabelText("대표 이미지 대체 텍스트"), "깨끗한 창문 청소 결과");

    expect(screen.getByText("권장 1920 × 1080px · 16:9 · JPG 또는 WebP")).toBeInTheDocument();
    expect(screen.getByText(/Storage 활성화 후 실제 저장/)).toBeInTheDocument();
    expect(screen.getByLabelText("대표 이미지 대체 텍스트")).toHaveValue("깨끗한 창문 청소 결과");
  });

  it("uploads a production landing hero and records only its private Storage path in the draft", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "production");
    heroStorageGatewayMocks.uploadHeroImage.mockResolvedValue({
      ok: true,
      path: "hero/new-image.webp",
      sizeBytes: 12,
      mimeType: "image/webp",
    });
    const user = userEvent.setup();
    function Harness() {
      const [home, setHome] = useState(structuredClone(SITE_CONTENT_SEED_SNAPSHOT.draft.home));
      return <><LandingHeroImageManager home={home} onChange={setHome} /><output data-testid="hero-storage-path">{home.heroImageStoragePath}</output></>;
    }
    render(<Harness />);

    await user.upload(screen.getByLabelText("랜딩 대표이미지 파일 선택"), new File(["hero"], "landing.jpg", { type: "image/jpeg" }));

    expect(await screen.findByText("대표 이미지를 Storage에 저장했습니다.")).toBeInTheDocument();
    expect(screen.getByTestId("hero-storage-path")).toHaveTextContent("hero/new-image.webp");
  });

  it("cleans a superseded unsaved landing hero upload", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "production");
    heroStorageGatewayMocks.uploadHeroImage
      .mockResolvedValueOnce({ ok: true, path: "hero/first.webp", sizeBytes: 12, mimeType: "image/webp" })
      .mockResolvedValueOnce({ ok: true, path: "hero/second.webp", sizeBytes: 12, mimeType: "image/webp" });
    heroStorageGatewayMocks.removeIfUnreferenced.mockResolvedValue({ ok: true, removed: true });
    const user = userEvent.setup();
    function Harness() {
      const [home, setHome] = useState(structuredClone(SITE_CONTENT_SEED_SNAPSHOT.draft.home));
      return <LandingHeroImageManager home={home} onChange={setHome} />;
    }
    render(<Harness />);

    const input = screen.getByLabelText("랜딩 대표이미지 파일 선택");
    await user.upload(input, new File(["first"], "first.jpg", { type: "image/jpeg" }));
    await user.upload(input, new File(["second"], "second.jpg", { type: "image/jpeg" }));

    await waitFor(() => expect(heroStorageGatewayMocks.removeIfUnreferenced).toHaveBeenCalledWith("hero/first.webp"));
    expect(screen.getByText(/이전 임시 파일도 정리/)).toBeInTheDocument();
  });

  it("uses a published hero URL on the public landing page", () => {
    const siteSeed = structuredClone(SITE_CONTENT_SEED_SNAPSHOT);
    siteSeed.published.home.heroImageUrl = "https://images.example/hero.webp";
    siteSeed.published.home.heroImageAlt = "테스트 히어로";
    const siteRepository = new LocalStorageSiteContentRepository(localStorage, siteSeed);
    const portfolioRepository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<SiteContentProvider repository={siteRepository}><PortfolioProvider repository={portfolioRepository}><HomeSections /></PortfolioProvider></SiteContentProvider>);

    expect(screen.getByRole("img", { name: "테스트 히어로" })).toHaveStyle({ backgroundImage: "url(https://images.example/hero.webp)" });
  });
});

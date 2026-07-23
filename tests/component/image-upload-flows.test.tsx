import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

describe("ImageDropzone", () => {
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

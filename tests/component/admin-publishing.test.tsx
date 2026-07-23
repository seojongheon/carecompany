import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { UploadPanel } from "@/features/uploads/ui/upload-panel";
import { YouTubeManager } from "@/features/portfolio/ui/youtube-manager";
import { PublishChecklist } from "@/features/publishing/ui/publish-checklist";
import { PhotoManager } from "@/features/uploads/ui/photo-manager";

describe("admin media and publishing", () => {
  beforeEach(() => localStorage.clear());

  it("blocks 21 files before upload and keeps valid session previews", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    render(<PortfolioProvider repository={repository}><UploadPanel caseId={draft.id} /></PortfolioProvider>);
    const input = screen.getByLabelText("사례 사진 파일 선택");
    const tooMany = Array.from({ length: 21 }, (_, index) => new File(["x"], `${index}.jpg`, { type: "image/jpeg" }));
    await user.upload(input, tooMany);
    expect(screen.getByRole("alertdialog")).toHaveTextContent("한 번에 최대 20장");
    await user.click(screen.getByRole("button", { name: "확인" }));

    await user.upload(input, [new File(["ok"], "clean.jpg", { type: "image/jpeg" })]);
    expect(screen.getByText("clean.jpg")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "clean.jpg 미리보기" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("완료")).toBeInTheDocument());
  });

  it("validates YouTube URLs and enforces three items", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    render(<PortfolioProvider repository={repository}><YouTubeManager caseId={draft.id} /></PortfolioProvider>);

    await user.type(screen.getByLabelText("YouTube 주소"), "https://vimeo.com/1");
    await user.click(screen.getByRole("button", { name: "영상 추가" }));
    expect(screen.getByText("지원하는 YouTube 주소를 입력해 주세요.")).toBeInTheDocument();
    for (const id of ["dQw4w9WgXcQ", "M7lc1UVf-VE", "aqz-KE-bpKQ"]) {
      await user.clear(screen.getByLabelText("YouTube 주소"));
      await user.type(screen.getByLabelText("YouTube 주소"), `https://youtu.be/${id}`);
      await user.click(screen.getByRole("button", { name: "영상 추가" }));
    }
    expect(screen.getAllByTestId("youtube-item")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "영상 추가" })).toBeDisabled();
    await user.click(screen.getAllByRole("checkbox", { name: /영상 공개/ })[0]);
    await user.click(screen.getAllByRole("button", { name: /위로 이동/ })[1]);
    const saved = repository.getAdminCaseById(draft.id)!.videos;
    expect(saved.some(({ public: isPublic }) => isPublic)).toBe(true);
    expect(saved[0].youtubeVideoId).toBe("M7lc1UVf-VE");
  });

  it("bulk classifies photos and edits alt text while preserving one cover", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    render(<PortfolioProvider repository={repository}><PhotoManager caseId={draft.id} /></PortfolioProvider>);

    const selections = screen.getAllByRole("checkbox", { name: /사진 선택/ });
    await user.click(selections[0]);
    await user.click(selections[1]);
    await user.selectOptions(screen.getByLabelText("선택 사진 단계"), "process");
    await user.click(screen.getByRole("button", { name: "선택 사진 공개" }));
    await user.clear(screen.getAllByLabelText(/대체 텍스트/)[0]);
    await user.type(screen.getAllByLabelText(/대체 텍스트/)[0], "작업 과정을 보여 주는 안전한 설명");
    await user.tab();

    await waitFor(() => {
      const media = repository.getAdminCaseById(draft.id)!.media;
      expect(media.every(({ stage }) => stage === "process")).toBe(true);
      expect(media.every(({ public: isPublic }) => isPublic)).toBe(true);
      expect(media[0].altText).toBe("작업 과정을 보여 주는 안전한 설명");
      expect(media.filter(({ cover }) => cover).length).toBeLessThanOrEqual(1);
    });
  });

  it("blocks incomplete publication, then publishes and unpublishes customer visibility", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    const firstRender = render(<PortfolioProvider repository={repository}><PublishChecklist caseId={draft.id} /></PortfolioProvider>);

    expect(screen.getByRole("button", { name: "사례 공개" })).toBeDisabled();
    expect(screen.getByText(/공개 가능한 대표 사진/)).toBeInTheDocument();
    firstRender.unmount();

    const publicCase = repository.listPublicCases({ limit: 1 }).items[0];
    repository.unpublishCase(publicCase.id);
    render(<PortfolioProvider repository={repository}><PublishChecklist caseId={publicCase.id} /></PortfolioProvider>);
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    const checks = screen.getAllByRole("checkbox");
    for (const check of checks) if (!(check as HTMLInputElement).checked) await user.click(check);
    await user.click(screen.getByRole("button", { name: "사례 공개" }));
    await waitFor(() => expect(repository.getPublicCaseBySlug(publicCase.slug)).not.toBeNull());
    await user.click(screen.getByRole("button", { name: "비공개로 전환" }));
    await user.click(screen.getByRole("button", { name: "비공개 전환 확인" }));
    expect(repository.getPublicCaseBySlug(publicCase.slug)).toBeNull();
  });

  it("soft-deletes a case only after explicit confirmation", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    render(<PortfolioProvider repository={repository}><PublishChecklist caseId={draft.id} /></PortfolioProvider>);

    await user.click(screen.getByRole("button", { name: "사례 삭제" }));
    expect(screen.getByRole("dialog", { name: "사례를 삭제 상태로 바꿀까요?" })).toBeInTheDocument();
    expect(repository.getAdminCaseById(draft.id)).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "삭제 확인" }));
    expect(repository.getAdminCaseById(draft.id)?.status).toBe("deleted");
  });
});

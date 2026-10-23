import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { SupabasePortfolioRepository, type PortfolioRemoteGateway } from "@/features/portfolio/repository/supabase-portfolio-repository";
import { AdminCaseForm } from "@/features/portfolio/ui/admin-case-form";
import { YouTubeManager } from "@/features/portfolio/ui/youtube-manager";
import { PhotoManager } from "@/features/uploads/ui/photo-manager";
import { PublishChecklist } from "@/features/publishing/ui/publish-checklist";
import type { PublishChecklist as Checklist } from "@/features/portfolio/model/types";

// Keep the actual repository/provider/UI path; delay only the remote persistence boundary.
function delayedRemote() {
  const stored = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
  const caseId = stored.listAdminCases({ status: "private" })[0].id;
  let release!: () => void;
  let markStarted!: () => void;
  let writes = 0;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { markStarted = resolve; });
  const wait = async () => { if (writes++ === 0) { markStarted(); await gate; } };
  const remote: Pick<PortfolioRemoteGateway, "loadSnapshot" | "replaceMedia" | "replaceTags" | "replaceVideos" | "updateCase"> = {
    loadSnapshot: async () => stored.getSnapshot(),
    replaceMedia: async (id, media) => { await wait(); stored.setCaseMedia(id, media); },
    replaceTags: async (id, tags) => { await wait(); stored.setCaseTags(id, tags); },
    replaceVideos: async (id, videos) => { await wait(); stored.setCaseVideos(id, videos); },
    updateCase: async (id, row) => { await wait(); stored.updateCase(id, { privacyChecklist: row.privacy_checklist as Checklist }); return {}; },
  };
  return { caseId, stored, repository: new SupabasePortfolioRepository(remote as PortfolioRemoteGateway), started, release };
}

describe("queued case editing", () => {
  beforeEach(() => localStorage.clear());

  it("keeps both photo edits while the first save is still in flight", async () => {
    const remote = delayedRemote();
    render(<PortfolioProvider repository={remote.repository}><PhotoManager caseId={remote.caseId} /></PortfolioProvider>);
    const alt = (await screen.findAllByLabelText(/대체 텍스트/))[0];
    const caption = screen.getAllByLabelText("캡션")[0];
    fireEvent.blur(alt, { target: { value: "보존할 대체 텍스트" } });
    await remote.started;
    fireEvent.blur(caption, { target: { value: "보존할 캡션" } });
    await act(async () => remote.release());
    await waitFor(() => expect(remote.repository.getAdminCaseById(remote.caseId)?.media[0]).toMatchObject({ altText: "보존할 대체 텍스트", caption: "보존할 캡션" }));
  });

  it("keeps both privacy acknowledgements while the first save is in flight", async () => {
    const remote = delayedRemote();
    const current = remote.stored.getAdminCaseById(remote.caseId)!;
    remote.stored.updateCase(remote.caseId, { privacyChecklist: { ...current.privacyChecklist, noIdentifiablePeople: false, noVehiclePlates: false } });
    render(<PortfolioProvider repository={remote.repository}><PublishChecklist caseId={remote.caseId} /></PortfolioProvider>);
    const checks = await screen.findAllByRole("checkbox");
    fireEvent.click(checks[0]);
    await remote.started;
    fireEvent.click(checks[1]);
    await act(async () => remote.release());
    await waitFor(() => expect(remote.repository.getAdminCaseById(remote.caseId)?.privacyChecklist).toMatchObject({ noIdentifiablePeople: true, noVehiclePlates: true }));
  });

  it("keeps both tag selections while the first save is in flight", async () => {
    const remote = delayedRemote();
    remote.stored.setCaseTags(remote.caseId, []);
    render(<PortfolioProvider repository={remote.repository}><AdminCaseForm mode="edit" caseId={remote.caseId} autosaveMs={60_000} /></PortfolioProvider>);
    const checks = await screen.findAllByRole("checkbox");
    fireEvent.click(checks[0]);
    await remote.started;
    fireEvent.click(checks[1]);
    await act(async () => remote.release());
    await waitFor(() => expect(remote.repository.getAdminCaseById(remote.caseId)?.tags).toHaveLength(2));
  });

  it("keeps both video edits while the first save is in flight", async () => {
    const remote = delayedRemote();
    remote.stored.setCaseVideos(remote.caseId, [{ id: "video-queued", caseId: remote.caseId, youtubeVideoId: "dQw4w9WgXcQ", originalUrl: "https://youtu.be/dQw4w9WgXcQ", title: "기존 제목", caption: "", public: false, sortOrder: 0 }]);
    render(<PortfolioProvider repository={remote.repository}><YouTubeManager caseId={remote.caseId} /></PortfolioProvider>);
    const title = await screen.findByLabelText("영상 제목");
    fireEvent.blur(title, { target: { value: "보존할 영상 제목" } });
    await remote.started;
    fireEvent.blur(screen.getByLabelText("짧은 설명"), { target: { value: "보존할 영상 설명" } });
    await act(async () => remote.release());
    await waitFor(() => expect(remote.repository.getAdminCaseById(remote.caseId)?.videos[0]).toMatchObject({ title: "보존할 영상 제목", caption: "보존할 영상 설명" }));
  });
});

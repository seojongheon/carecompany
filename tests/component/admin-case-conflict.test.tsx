import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { SupabasePortfolioRepository, type PortfolioRemoteGateway } from "@/features/portfolio/repository/supabase-portfolio-repository";
import { AdminCaseForm } from "@/features/portfolio/ui/admin-case-form";

describe("case form conflict recovery", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("does not save or increase a revision when an editor opens without changing anything", async () => {
    const snapshot = structuredClone(SEED_SNAPSHOT);
    const current = snapshot.cases.find(item => item.status === "private")!;
    const save = vi.fn().mockResolvedValue({});
    const repository = new SupabasePortfolioRepository({ loadSnapshot: async () => snapshot, updateCase: save } as unknown as PortfolioRemoteGateway);
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={100} /></PortfolioProvider>);
    expect(await screen.findByLabelText("사례 제목")).toHaveValue(current.title);
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).not.toHaveBeenCalled();
    expect(screen.queryByText("저장했습니다.")).not.toBeInTheDocument();
  });

  it.each(["manual", "automatic"])("stops after a slow %s save conflicts, retains input, and permits a deliberate retry", async (trigger) => {
    const snapshot = structuredClone(SEED_SNAPSHOT);
    const current = snapshot.cases.find(item => item.status === "private")!;
    let rejectSave!: (reason: Error) => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise((_, reject) => { rejectSave = reject; }))
      .mockImplementation(() => new Promise(() => {}));
    const remote = { loadSnapshot: async () => snapshot, updateCase: save };
    const repository = new SupabasePortfolioRepository(remote as unknown as PortfolioRemoteGateway);
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={100} /></PortfolioProvider>);
    const title = await screen.findByLabelText("사례 제목");
    fireEvent.change(title, { target: { value: "충돌해도 남아 있는 내 입력" } });
    if (trigger === "manual") fireEvent.click(screen.getByRole("button", { name: "지금 저장" }));
    else await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "지금 저장" })).toBeDisabled();
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    await act(async () => { rejectSave(new Error("case_revision_conflict")); });
    await waitFor(() => expect(screen.getAllByRole("alert")[0]).toHaveTextContent("다른 관리자가 먼저 저장했습니다"));
    expect(title).toHaveValue("충돌해도 남아 있는 내 입력");
    expect(screen.getByRole("button", { name: "지금 저장" })).toBeEnabled();
    expect(save).toHaveBeenCalledOnce();
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "지금 저장" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  });

  it("autosaves input typed during a slow successful save after that save finishes", async () => {
    const snapshot = structuredClone(SEED_SNAPSHOT);
    const current = snapshot.cases.find(item => item.status === "private")!;
    let finishSave!: (result: object) => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; })).mockResolvedValue({});
    const repository = new SupabasePortfolioRepository({ loadSnapshot: async () => snapshot, updateCase: save } as unknown as PortfolioRemoteGateway);
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={100} /></PortfolioProvider>);
    const title = await screen.findByLabelText("사례 제목");
    fireEvent.change(title, { target: { value: "먼저 저장한 제목" } });
    fireEvent.click(screen.getByRole("button", { name: "지금 저장" }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    fireEvent.change(title, { target: { value: "저장 중 추가한 제목" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    await act(async () => { finishSave({}); });
    expect(save).toHaveBeenCalledOnce();
    await act(async () => { await vi.advanceTimersByTimeAsync(150); });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]).toEqual([current.id, expect.objectContaining({ title: "저장 중 추가한 제목" })]);
    expect(title).toHaveValue("저장 중 추가한 제목");
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it.each(["내 입력 다시 저장", "최신 내용으로 입력 바꾸기"])("resumes autosave after resolving a conflict with %s", async (recovery) => {
    const snapshot = structuredClone(SEED_SNAPSHOT);
    const current = snapshot.cases.find(item => item.status === "private")!;
    const save = vi.fn().mockRejectedValueOnce(new Error("case_revision_conflict")).mockResolvedValue({});
    const repository = new SupabasePortfolioRepository({ loadSnapshot: async () => snapshot, updateCase: save } as unknown as PortfolioRemoteGateway);
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={100} /></PortfolioProvider>);
    fireEvent.change(await screen.findByLabelText("사례 제목"), { target: { value: "충돌한 내 제목" } });
    fireEvent.click(screen.getByRole("button", { name: "지금 저장" }));
    await waitFor(() => expect(screen.getAllByRole("alert")[0]).toHaveTextContent("다른 관리자가 먼저 저장했습니다"));
    current.title = "서버에 저장된 최신 제목";
    fireEvent.click(screen.getByRole("button", { name: "최신 버전 불러오기" }));
    expect(await screen.findByRole("heading", { name: "최신 저장 내용과 내 입력 비교" })).toBeVisible();
    expect(screen.getByLabelText("사례 제목")).toHaveValue("충돌한 내 제목");
    fireEvent.click(screen.getByRole("button", { name: recovery }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "최신 저장 내용과 내 입력 비교" })).not.toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const expectedSaves = recovery === "내 입력 다시 저장" ? 2 : 1;
    expect(save).toHaveBeenCalledTimes(expectedSaves);
    expect(screen.getByLabelText("사례 제목")).toHaveValue(recovery === "내 입력 다시 저장" ? "충돌한 내 제목" : "서버에 저장된 최신 제목");
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).toHaveBeenCalledTimes(expectedSaves);
    fireEvent.change(screen.getByLabelText("사례 제목"), { target: { value: "복구 후 이어 쓴 제목" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(150); });
    expect(save).toHaveBeenCalledTimes(expectedSaves + 1);
    expect(save.mock.calls.at(-1)).toEqual([current.id, expect.objectContaining({ title: "복구 후 이어 쓴 제목" })]);
  });

  it("preserves reverting to the original value while a different value is being saved", async () => {
    const snapshot = structuredClone(SEED_SNAPSHOT);
    const current = snapshot.cases.find(item => item.status === "private")!;
    const originalTitle = current.title;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let writes = 0;
    const save = vi.fn(async (_id: string, row: Record<string, unknown>) => {
      if (writes++ === 0) await gate;
      current.title = String(row.title);
      current.updatedAt = `2026-10-19T09:00:0${writes}.000Z`;
      return {};
    });
    const repository = new SupabasePortfolioRepository({ loadSnapshot: async () => structuredClone(snapshot), updateCase: save } as unknown as PortfolioRemoteGateway);
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={100} /></PortfolioProvider>);
    const title = await screen.findByLabelText("사례 제목");
    fireEvent.change(title, { target: { value: "서버로 보내는 새 제목" } });
    fireEvent.click(screen.getByRole("button", { name: "지금 저장" }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    fireEvent.change(title, { target: { value: originalTitle } });
    await act(async () => { release(); });
    expect(title).toHaveValue(originalTitle);
    expect(current.title).toBe("서버로 보내는 새 제목");
    await act(async () => { await vi.advanceTimersByTimeAsync(150); });
    expect(save).toHaveBeenCalledTimes(2);
    expect(current.title).toBe(originalTitle);
    expect(title).toHaveValue(originalTitle);
  });

  it("compares only fresh data after a failed latest-version load is retried", async () => {
    const initial = structuredClone(SEED_SNAPSHOT);
    const current = initial.cases.find(item => item.status === "private")!;
    const fresh = structuredClone(initial);
    fresh.cases.find(item => item.id === current.id)!.title = "실제 최신 서버 제목";
    const load = vi.fn().mockResolvedValueOnce(initial).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(fresh);
    const save = vi.fn().mockRejectedValue(new Error("case_revision_conflict"));
    const repository = new SupabasePortfolioRepository({ loadSnapshot: load, updateCase: save } as unknown as PortfolioRemoteGateway);
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={60_000} /></PortfolioProvider>);
    fireEvent.change(await screen.findByLabelText("사례 제목"), { target: { value: "내가 입력한 제목" } });
    fireEvent.click(screen.getByRole("button", { name: "지금 저장" }));
    await waitFor(() => expect(screen.getAllByRole("alert")[0]).toHaveTextContent("다른 관리자가 먼저 저장했습니다"));
    fireEvent.click(screen.getByRole("button", { name: "최신 버전 불러오기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("사례를 불러오지 못했습니다");
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await screen.findByRole("heading", { name: "최신 저장 내용과 내 입력 비교" });
    expect(repository.getAdminCaseById(current.id)?.title).toBe("실제 최신 서버 제목");
    expect(screen.getByLabelText("사례 제목")).toHaveValue("내가 입력한 제목");
    fireEvent.click(screen.getByRole("button", { name: "최신 내용으로 입력 바꾸기" }));
    expect(screen.getByLabelText("사례 제목")).toHaveValue("실제 최신 서버 제목");
    expect(save).toHaveBeenCalledOnce();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { AdminCaseForm } from "@/features/portfolio/ui/admin-case-form";
import { AdminCaseList } from "@/features/portfolio/ui/admin-case-list";

describe("admin draft flows", () => {
  beforeEach(() => localStorage.clear());

  it("shows dashboard statistics and filters private drafts without login", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><AdminDashboard /><AdminCaseList /></PortfolioProvider>);

    expect(screen.getByText("전체 사례").closest("article")).toHaveTextContent("20");
    expect(screen.getByText("공개 사례").closest("article")).toHaveTextContent("16");
    await user.selectOptions(screen.getByLabelText("공개 상태"), "private");
    expect(screen.getAllByTestId("admin-case-row")).toHaveLength(4);
  });

  it("starts creation from case management instead of a separate dashboard or menu shortcut", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><AdminDashboard /><AdminSidebar /><AdminCaseList /></PortfolioProvider>);

    expect(screen.getByRole("link", { name: "사례 추가" })).toHaveAttribute("href", "/admin/portfolio/new");
    expect(screen.queryByRole("link", { name: /새 사례/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "편집" })).not.toHaveLength(0);
  });

  it("validates required fields and creates a private draft", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="create" /></PortfolioProvider>);

    await user.click(screen.getByRole("button", { name: "비공개 초안 만들기" }));
    expect(await screen.findByText("제목을 입력해 주세요.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("사례 제목"), "새 에어컨 작업 사례");
    await user.selectOptions(screen.getByLabelText("서비스"), "service-aircon");
    await user.type(screen.getByLabelText("표시 지역"), "아산 배방읍");
    await user.type(screen.getByLabelText("사례 경로"), "new-aircon-work");
    await user.click(screen.getByRole("button", { name: "비공개 초안 만들기" }));

    await waitFor(() => expect(repository.listAdminCases({ status: "private" })).toHaveLength(5));
    expect(repository.getPublicCaseBySlug("new-aircon-work")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("비공개 초안을 만들었습니다");
  });

  it("autosaves edit fields and restores them from browser storage", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const draft = repository.listAdminCases({ status: "private" })[0];
    render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={draft.id} autosaveMs={300} /></PortfolioProvider>);

    const title = screen.getByLabelText("사례 제목");
    await user.clear(title);
    await user.type(title, "자동 저장된 사례 제목");
    await vi.advanceTimersByTimeAsync(350);

    await waitFor(() => expect(repository.getAdminCaseById(draft.id)?.title).toBe("자동 저장된 사례 제목"));
    const restored = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    expect(restored.getAdminCaseById(draft.id)?.title).toBe("자동 저장된 사례 제목");
    vi.useRealTimers();
  });
});

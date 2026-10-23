import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import type { MockStoreEnvelope } from "@/features/portfolio/model/types";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { AdminCaseList } from "@/features/portfolio/ui/admin-case-list";

describe("case list presentation", () => {
  beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/admin/portfolio"); });

  it("shows the selected cover, work date, and last editor", () => {
    const snapshot: MockStoreEnvelope = structuredClone(SEED_SNAPSHOT);
    const current = { ...snapshot.cases[0], workDate: "2026-05-20", updatedBy: "00000000-0000-4000-8000-000000000001" };
    snapshot.cases[0] = current;
    const cover = snapshot.media.find(item => item.caseId === current.id && item.cover)!;
    const repository = new LocalStoragePortfolioRepository(localStorage, snapshot);
    render(<PortfolioProvider repository={repository}><AdminCaseList /></PortfolioProvider>);
    const row = within(screen.getByRole("heading", { name: current.title }).closest("article")!);
    expect(row.getByRole("img", { name: cover.altText })).toBeInTheDocument();
    expect(row.getByText(current.workDate)).toHaveAttribute("datetime", current.workDate);
    expect(row.getByText(current.updatedBy)).toBeInTheDocument();
    expect(row.getByText("수정자")).toBeInTheDocument();
  });

  it("provides an empty thumbnail and author state for a case without either", () => {
    const snapshot: MockStoreEnvelope = structuredClone(SEED_SNAPSHOT);
    const current = snapshot.cases.find(item => item.status === "private")!;
    snapshot.media = snapshot.media.filter(item => item.caseId !== current.id);
    const repository = new LocalStoragePortfolioRepository(localStorage, snapshot);
    render(<PortfolioProvider repository={repository}><AdminCaseList /></PortfolioProvider>);
    const row = within(screen.getByRole("heading", { name: current.title }).closest("article")!);
    expect(row.getByText("대표 사진 없음")).toBeInTheDocument();
    expect(row.getByText("기록 없음")).toBeInTheDocument();
  });
});

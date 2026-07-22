import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { HomeSections } from "@/components/site/home-sections";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioGrid } from "@/features/portfolio/ui/portfolio-grid";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";

describe("public browsing", () => {
  beforeEach(() => localStorage.clear());

  it("renders the public shell and four one-action PRD service links", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><Header /><HomeSections /><Footer /></PortfolioProvider>);

    for (const service of ["화장실 청소", "에어컨 청소", "아파트 유리창 청소", "상가 유리창 청소"]) {
      expect(screen.getAllByRole("link", { name: new RegExp(service) }).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("contentinfo")).toHaveTextContent("위생의 기술");
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("dialog", { name: "전체 메뉴" })).toBeInTheDocument();
  });

  it("shows only public cases and appends the next stable group", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const privateTitle = repository.listAdminCases({ status: "private" })[0].title;
    render(<PortfolioProvider repository={repository}><PortfolioGrid initialLimit={6} /></PortfolioProvider>);

    expect(screen.getAllByTestId("portfolio-card")).toHaveLength(6);
    expect(screen.queryByText(privateTitle)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "사례 더 보기" }));
    expect(screen.getAllByTestId("portfolio-card")).toHaveLength(12);
  });

  it("filters by service and exposes a resettable empty state", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><PortfolioGrid initialLimit={8} showFilters /></PortfolioProvider>);

    await user.selectOptions(screen.getByLabelText("서비스 필터"), "aircon");
    expect(screen.getAllByTestId("portfolio-card")).toHaveLength(4);
    expect(screen.getAllByTestId("portfolio-card").every((card) => card.textContent?.includes("에어컨 청소"))).toBe(true);

    await user.selectOptions(screen.getByLabelText("세부 필터"), "missing-tag");
    expect(screen.getByText("조건에 맞는 공개 사례가 없습니다")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "필터 초기화" }));
    expect(screen.getAllByTestId("portfolio-card")).toHaveLength(8);
  });
});

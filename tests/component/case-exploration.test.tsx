import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { CaseDetail } from "@/features/portfolio/ui/case-detail";
import { QuickView } from "@/features/portfolio/ui/quick-view";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";

describe("case exploration", () => {
  beforeEach(() => localStorage.clear());

  it("groups only public media and excludes the current case from related cards", () => {
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const item = repository.listPublicCases({ limit: 1 }).items[0];
    const detail = repository.getPublicCaseBySlug(item.slug)!;
    const related = repository.listRelatedPublicCases(detail.id, 3);
    render(<CaseDetail detail={detail} related={related} />);

    expect(screen.getByRole("heading", { name: "작업 전" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "작업 과정" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "작업 후" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "세부" })).not.toBeInTheDocument();
    expect(screen.queryByText(detail.title, { selector: "article h3" })).not.toBeInTheDocument();
  });

  it("loads a YouTube iframe only after explicit activation and never autoplays", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const withVideo = repository.listPublicCases({ limit: 20 }).items.find((item) => repository.getPublicCaseBySlug(item.slug)?.videos.length)!;
    render(<CaseDetail detail={repository.getPublicCaseBySlug(withVideo.slug)!} related={[]} />);

    expect(screen.queryByTitle(/YouTube/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /영상 재생/ }));
    const iframe = screen.getByTitle(/YouTube/);
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute("src")).not.toContain("autoplay=1");
  });

  it("opens an accessible quick view and traverses only the supplied filtered list", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    const items = repository.listPublicCases({ serviceKey: "aircon", limit: 10 }).items;
    render(<QuickView items={items} initialSlug={items[0].slug} onClose={() => undefined} />);

    expect(screen.getByRole("dialog", { name: items[0].title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전 사례" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "다음 사례" }));
    expect(screen.getByRole("dialog", { name: items[1].title })).toBeInTheDocument();
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
  });
});

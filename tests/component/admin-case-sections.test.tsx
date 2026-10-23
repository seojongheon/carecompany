import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { AdminCaseForm } from "@/features/portfolio/ui/admin-case-form";
import { AdminPublishingWorkspace } from "@/features/portfolio/ui/admin-publishing-workspace";
import { AdminCaseList } from "@/features/portfolio/ui/admin-case-list";
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/admin/portfolio"); });
it("keeps inputs mounted when navigating editing sections", () => {
 const repository = new LocalStoragePortfolioRepository(localStorage, structuredClone(SEED_SNAPSHOT));
 const current = SEED_SNAPSHOT.cases.find(item => item.status === "private")!;
 render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={60000} /></PortfolioProvider>);
 const title = screen.getByLabelText("사례 제목");
 fireEvent.change(title, { target: { value: "이동 후에도 유지할 제목" } });
 const navigation = within(screen.getByRole("navigation", { name: "사례 편집 영역" }));
 fireEvent.click(navigation.getByRole("link", { name: "검색 미리보기" }));
 expect(title).toHaveValue("이동 후에도 유지할 제목");
 expect(screen.getByLabelText("SEO 설명")).toBeVisible();
 fireEvent.click(navigation.getByRole("link", { name: "기본 정보" }));
 expect(screen.getByLabelText("사례 제목")).toBe(title);
});
it("changes status through URL filters and clears all conditions", () => {
 const repository = new LocalStoragePortfolioRepository(localStorage, structuredClone(SEED_SNAPSHOT));
 render(<PortfolioProvider repository={repository}><AdminCaseList /></PortfolioProvider>);
 fireEvent.change(screen.getByLabelText("제목·지역 검색"), { target: { value: "창틀" } });
 fireEvent.click(within(screen.getByRole("navigation", { name: "사례 상태" })).getByRole("button", { name: "휴지통" }));
 expect(new URLSearchParams(window.location.search).get("status")).toBe("deleted");
 expect(new URLSearchParams(window.location.search).get("q")).toBe("창틀");
 fireEvent.click(screen.getByRole("button", { name: "필터 초기화" }));
 expect(window.location.search).toBe("");
});

it("keeps restoration accessible for a deleted case in the editor layout", () => {
 const snapshot = structuredClone(SEED_SNAPSHOT);
 const current = snapshot.cases[0];
 current.status = "deleted";
 const repository = new LocalStoragePortfolioRepository(localStorage, snapshot);
 render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} sidebar={<AdminPublishingWorkspace caseId={current.id} section="review" />} /></PortfolioProvider>);
 fireEvent.click(screen.getByRole("button", { name: "휴지통에서 복원" }));
 expect(screen.getByRole("alertdialog", { name: "사례 변경 확인" })).toHaveTextContent("비공개 상태로 복원");
});
it("opens tag management from the list navigation", () => {
 const repository = new LocalStoragePortfolioRepository(localStorage, structuredClone(SEED_SNAPSHOT));
 render(<PortfolioProvider repository={repository}><AdminCaseList /></PortfolioProvider>);
 fireEvent.click(screen.getByRole("button", { name: "태그 관리" }));
 expect(screen.getByRole("button", { name: "태그 추가" })).toBeVisible();
});

it("keeps the work description label associated with its textbox", () => {
 const repository = new LocalStoragePortfolioRepository(localStorage, structuredClone(SEED_SNAPSHOT));
 const current = SEED_SNAPSHOT.cases.find(item => item.status === "private")!;
 render(<PortfolioProvider repository={repository}><AdminCaseForm mode="edit" caseId={current.id} autosaveMs={60000} /></PortfolioProvider>);
 const work = screen.getByRole("textbox", { name: "작업 내용" });
 expect(work).toHaveAttribute("id", "case-work");
 const navigation = within(screen.getByRole("navigation", { name: "사례 편집 영역" }));
 const link = navigation.getByRole("link", { name: "작업 내용" });
 expect(link).toHaveAttribute("href", "#case-work-section");
 expect(document.getElementById("case-work-section")).toContainElement(work);
});

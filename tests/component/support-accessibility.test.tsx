import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { EstimateFab } from "@/components/site/estimate-fab";
import { PricingSections } from "@/components/site/pricing-sections";
import { ProcessSections } from "@/components/site/process-sections";

describe("supporting content and accessibility", () => {
  it("presents four vertical-friendly pricing cards and expandable FAQ", async () => {
    const user = userEvent.setup();
    render(<PricingSections />);
    for (const service of ["화장실 청소", "에어컨 청소", "아파트 유리창 청소", "상가 유리창 청소"]) {
      expect(screen.getByRole("heading", { name: service })).toBeInTheDocument();
    }
    expect(screen.getByText(/실제 작업 가격이 아닌 안내용 기준/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "사진만으로 정확한 금액을 알 수 있나요?" }));
    expect(screen.getByText(/현장 상태와 작업 가능 범위/)).toBeVisible();
  });

  it("renders all seven process steps and service-specific notes", () => {
    render(<ProcessSections />);
    expect(screen.getAllByTestId("process-step")).toHaveLength(7);
    expect(screen.getByRole("heading", { name: "서비스별로 달라지는 점" })).toBeInTheDocument();
  });

  it("keeps the visual-only estimate affordance labelled and touch-sized", () => {
    render(<EstimateFab />);
    const button = screen.getByRole("button", { name: "사진 견적 열기 (준비 중)" });
    expect(button.className).toContain("min-h-12");
    expect(button).toHaveAttribute("title", "견적 기능은 추후 연결됩니다");
  });
});

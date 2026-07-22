import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { StatusState } from "@/components/site/status-state";

function ToastProbe() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ title: "저장 완료", description: "변경 내용을 저장했습니다." })}>알림</Button>;
}

describe("shared UI primitives", () => {
  it("opens and closes an accessible dialog", async () => {
    const user = userEvent.setup();
    render(<Dialog><DialogTrigger asChild><Button>열기</Button></DialogTrigger><DialogContent><DialogTitle>상세 보기</DialogTitle><DialogDescription>사례의 자세한 내용입니다.</DialogDescription><p>내용</p></DialogContent></Dialog>);
    await user.click(screen.getByRole("button", { name: "열기" }));
    expect(screen.getByRole("dialog", { name: "상세 보기" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("changes tabs and expands an accordion with keyboard-accessible controls", async () => {
    const user = userEvent.setup();
    render(<><Tabs defaultValue="one"><TabsList><TabsTrigger value="one">첫째</TabsTrigger><TabsTrigger value="two">둘째</TabsTrigger></TabsList><TabsContent value="one">첫 내용</TabsContent><TabsContent value="two">둘째 내용</TabsContent></Tabs><Accordion type="single" collapsible><AccordionItem value="faq"><AccordionTrigger>자주 묻는 질문</AccordionTrigger><AccordionContent>답변입니다.</AccordionContent></AccordionItem></Accordion></>);
    await user.click(screen.getByRole("tab", { name: "둘째" }));
    expect(screen.getByText("둘째 내용")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "자주 묻는 질문" }));
    expect(screen.getByText("답변입니다.")).toBeVisible();
  });

  it("associates form labels and exposes non-color status and toast messages", async () => {
    const user = userEvent.setup();
    render(<ToastProvider><Label htmlFor="title">사례 제목</Label><Input id="title" aria-invalid="true" /><StatusState kind="error" title="불러오지 못했습니다" description="다시 시도해 주세요." /><ToastProbe /></ToastProvider>);
    expect(screen.getByLabelText("사례 제목")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("불러오지 못했습니다");
    await user.click(screen.getByRole("button", { name: "알림" }));
    expect(screen.getByRole("status")).toHaveTextContent("저장 완료");
  });
});

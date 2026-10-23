import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { ServicesAdmin } from "@/features/site-content/ui/services-admin";
import { SiteContentAdmin } from "@/features/site-content/ui/site-content-admin";
const state=vi.hoisted(()=>({query:"",replace:vi.fn(),navigate:vi.fn(()=>true)}));
vi.mock("next/navigation",()=>({useSearchParams:()=>new URLSearchParams(state.query),useRouter:()=>({replace:state.replace})}));
vi.mock("@/features/site-content/ui/document-editor",()=>({confirmDocumentNavigation:state.navigate,DocumentEditor:({documentKey}:{documentKey:string})=><div data-testid="document">{documentKey}</div>}));
vi.mock("@/features/site-content/server/actions",()=>({listAnnouncements:vi.fn(async()=>({ok:true,documents:[],total:0}))}));
beforeEach(()=>{state.query="";state.replace.mockClear();state.navigate.mockReset().mockReturnValue(true);});
it("restores selected service from URL and preserves unrelated query parameters",async()=>{
 state.query="document=service%3Aaircon&source=dashboard";render(<ServicesAdmin/>);
 expect(screen.getByTestId("document")).toHaveTextContent("service:aircon");
 await userEvent.click(screen.getByRole("button",{name:"화장실"}));
 expect(state.replace).toHaveBeenCalledWith("/admin/services?document=service%3Abathroom&source=dashboard");
});
it("keeps the current service when the unsaved guard rejects navigation",async()=>{
 state.navigate.mockReturnValue(false);render(<ServicesAdmin/>);
 await userEvent.click(screen.getByRole("button",{name:"화장실"}));expect(state.replace).not.toHaveBeenCalled();
});
it("exposes announcements as a document navigation entry with search and pagination",async()=>{
 render(<SiteContentAdmin/>);await userEvent.click(screen.getByRole("button",{name:"공지사항"}));
 expect(state.replace).toHaveBeenCalledWith("/admin/site?document=announcements");
});
it("shows announcement management without an invalid document editor",async()=>{
 state.query="document=announcements";render(<SiteContentAdmin/>);
 expect(await screen.findByRole("button",{name:"공지사항 작성"})).toBeVisible();expect(screen.queryByTestId("document")).not.toBeInTheDocument();
 expect(screen.getByRole("textbox",{name:"공지 제목 검색"})).toBeVisible();
});

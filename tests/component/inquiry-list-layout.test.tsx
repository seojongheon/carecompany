import {render,screen} from "@testing-library/react";
import {expect,it,vi} from "vitest";
import InquiriesPage from "@/app/admin/(protected)/inquiries/page";
vi.mock("@/features/inquiries/server/queries",()=>({listInquiries:vi.fn(async()=>({items:[],total:0,filters:{page:1,q:"",sort:"newest",assignee:"mine"}})),inquiryStaffOptions:vi.fn(async()=>[])}));
vi.mock("@/features/inquiries/ui/inquiry-form",()=>({InquiryForm:()=> <div>수동 문의 양식</div>}));
it("exposes all inquiry scopes without removing existing advanced filters",async()=>{
 render(await InquiriesPage({searchParams:Promise.resolve({assignee:"mine"})}));
 expect(screen.getByRole("link",{name:"내 담당"})).toHaveAttribute("aria-current","page");
 expect(screen.getByRole("link",{name:"스팸"})).toHaveAttribute("href","/admin/inquiries?status=spam");
 expect(screen.getByLabelText("접수 경로")).toBeInTheDocument();
 expect(screen.getByLabelText("읽지 않은 문의")).toBeInTheDocument();
 expect(screen.getByText("수동 문의 양식")).toBeInTheDocument();
});

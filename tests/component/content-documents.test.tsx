import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentEditor } from "@/features/site-content/ui/document-editor";
import { getDocumentDefaults } from "@/features/site-content/model/documents";
import { readDocument, saveDocument, publishDocument } from "@/features/site-content/server/actions";
import { SiteContentProvider } from "@/features/site-content/repository/site-content-provider";
import { SupabaseSiteContentRepository } from "@/features/site-content/repository/supabase-site-content-repository";
import { HomeSections } from "@/components/site/home-sections";
vi.mock("@/features/site-content/server/actions",()=>({readDocument:vi.fn(),saveDocument:vi.fn(),publishDocument:vi.fn(),restoreDocument:vi.fn(),previewDocument:vi.fn()}));
vi.mock("@/features/media/media-library",()=>({MediaLibrary:()=>null}));
beforeEach(()=>vi.resetAllMocks());
const doc=(key="home")=>({key,revision:5,draft:getDocumentDefaults(key),published:getDocumentDefaults(key),published_at:"2026-10-19T00:00:00Z",updated_at:"2026-10-19T00:00:00Z"});
describe("document editor",()=>{
 it("keeps an exact label for a prefilled announcement body while editing",async()=>{
  vi.mocked(readDocument).mockResolvedValue({ok:true,document:doc("announcement:label-test"),versions:[]});
  render(<DocumentEditor documentKey="announcement:label-test"/>);
  const body=await screen.findByLabelText("본문",{exact:true});
  expect(body).toHaveAttribute("aria-label","본문");
  await userEvent.clear(body);await userEvent.type(body,"수정한 공지 본문");
  expect(screen.getByLabelText("본문",{exact:true})).toHaveValue("수정한 공지 본문");
 });
 it("keeps exact labels for prefilled string-list fields",async()=>{
  const initial=doc("service:bathroom");initial.draft={...initial.draft,inclusions:["청소 준비","마무리 점검"]};
  vi.mocked(readDocument).mockResolvedValue({ok:true,document:initial,versions:[]});
  render(<DocumentEditor documentKey="service:bathroom"/>);
  const inclusions=await screen.findByLabelText("포함 사항",{exact:true});
  expect(inclusions).toHaveAttribute("aria-label","포함 사항");
  await userEvent.clear(inclusions);await userEvent.type(inclusions,"수정한 포함 사항");
  expect(screen.getByLabelText("포함 사항",{exact:true})).toHaveValue("수정한 포함 사항");
 });
 it("preserves input and stops publication when a concurrent save conflicts",async()=>{
  vi.mocked(readDocument).mockResolvedValue({ok:true,document:doc(),versions:[]});
  vi.mocked(saveDocument).mockResolvedValue({ok:false,error:"다른 관리자가 변경했습니다.",conflict:true});
  render(<DocumentEditor documentKey="home"/>);const user=userEvent.setup();const title=await screen.findByLabelText("제목");await user.clear(title);await user.type(title,"내가 수정한 제목");await user.click(screen.getByRole("button",{name:"이 문서 게시"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("다른 관리자가 변경했습니다");expect(title).toHaveValue("내가 수정한 제목");expect(publishDocument).not.toHaveBeenCalled();expect(saveDocument).toHaveBeenCalledWith("home",5,expect.objectContaining({title:"내가 수정한 제목"}));
 });
 it("saves and publishes only the selected document at its new revision",async()=>{
  vi.mocked(readDocument).mockResolvedValue({ok:true,document:doc("about"),versions:[]});
  vi.mocked(saveDocument).mockResolvedValue({ok:true,document:{...doc("about"),revision:6}});
  vi.mocked(publishDocument).mockResolvedValue({ok:true,document:{...doc("about"),revision:7}});
  render(<DocumentEditor documentKey="about"/>);await screen.findByDisplayValue("보이는 결과와 확인 가능한 과정");await userEvent.click(screen.getByRole("button",{name:"이 문서 게시"}));
  expect(await screen.findByRole("status")).toHaveTextContent("다른 문서의 초안은 그대로 유지됩니다");expect(publishDocument).toHaveBeenCalledExactlyOnceWith("about",6);
 });
 it("locks editing during save and keeps the submitted input when publishing fails",async()=>{
  const initial=doc("about");
  vi.mocked(readDocument).mockResolvedValue({ok:true,document:initial,versions:[]});
  let finishSave!:(value:Awaited<ReturnType<typeof saveDocument>>)=>void;
  vi.mocked(saveDocument).mockReturnValue(new Promise(resolve=>{finishSave=resolve;}));
  vi.mocked(publishDocument).mockResolvedValue({ok:false,error:"게시 연결이 끊어졌습니다.",conflict:false});
  const user=userEvent.setup();render(<DocumentEditor documentKey="about"/>);
  const title=await screen.findByDisplayValue("보이는 결과와 확인 가능한 과정");await user.clear(title);await user.type(title,"보존할 제목");
  await user.click(screen.getByRole("button",{name:"이 문서 게시"}));
  expect(title).toBeDisabled();
  expect(screen.getByRole("button",{name:"모바일 미리보기"})).toBeDisabled();
  expect(screen.getByRole("button",{name:"게시 이력"})).toBeDisabled();
  await user.type(title,"응답 대기 중 입력");expect(title).toHaveValue("보존할 제목");
  await act(async()=>{finishSave({ok:true,document:{...initial,revision:6,draft:{...initial.draft,title:"보존할 제목"}}});});
  expect(await screen.findByRole("alert")).toHaveTextContent("게시 연결이 끊어졌습니다");
  expect(title).toHaveValue("보존할 제목");expect(title).toBeEnabled();
 });
 it("lets an ordinary administrator read policy without edit or publish controls",async()=>{
  vi.mocked(readDocument).mockResolvedValue({ok:true,document:doc("policy"),versions:[]});
  render(<DocumentEditor documentKey="policy"/>);const title=await screen.findByLabelText("제목");expect(title).toBeDisabled();expect(screen.queryByRole("button",{name:"이 문서 게시"})).not.toBeInTheDocument();expect(screen.getByText(/정책은 읽기 전용/)).toBeInTheDocument();
 });
 it("shows a retry state instead of seed content after a failed public query",async()=>{
  const repository=new SupabaseSiteContentRepository({loadSnapshot:async()=>{throw new Error("offline");}} as never);
  render(<SiteContentProvider repository={repository}><HomeSections/></SiteContentProvider>);
  expect(await screen.findByRole("alert")).toHaveTextContent("공개 콘텐츠를 불러오지 못했습니다");expect(screen.queryByText("말보다 현장으로 보여드리는 청소")).not.toBeInTheDocument();expect(screen.getByRole("button",{name:"다시 시도"})).toBeInTheDocument();
 });
});

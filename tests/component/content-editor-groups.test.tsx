import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DocumentEditor } from "@/features/site-content/ui/document-editor";
import { getDocumentDefaults } from "@/features/site-content/model/documents";
import { readDocument, readDocumentHistory, restoreDocument, previewDocument } from "@/features/site-content/server/actions";
vi.mock("@/features/site-content/server/actions",()=>({readDocument:vi.fn(),saveDocument:vi.fn(),publishDocument:vi.fn(),restoreDocument:vi.fn(),readDocumentHistory:vi.fn(),previewDocument:vi.fn()}));
vi.mock("@/features/media/media-library",()=>({MediaLibrary:()=>null}));
it("groups every home field, keeps unfamiliar fields, and retains input across comparison",async()=>{
 const draft={...getDocumentDefaults("home"),futureField:"보존할 값"};
 vi.mocked(readDocument).mockResolvedValue({ok:true,document:{key:"home",revision:1,draft,published:draft,published_at:null,updated_at:"2026-10-23"},versions:[]});
 render(<DocumentEditor documentKey="home"/>);
 expect(await screen.findByRole("heading",{name:"대표 영역"})).toBeVisible();
 expect(screen.getByRole("heading",{name:"이미지·미디어"})).toBeVisible();
 expect(screen.getByLabelText("futureField")).toHaveValue("보존할 값");
 const title=screen.getByLabelText("제목");await userEvent.clear(title);await userEvent.type(title,"새 제목");
 await userEvent.click(screen.getByRole("button",{name:"공개본과 비교"}));
 expect(screen.getByText(/새 제목/)).toBeVisible();
 await userEvent.click(screen.getByRole("button",{name:"편집"}));expect(screen.getByLabelText("제목")).toHaveValue("새 제목");
 expect(screen.getByRole("complementary",{name:"문서 저장·게시"})).toBeVisible();
});

it("retains preview, paged publication history, and confirmed draft-only restore",async()=>{
 const draft=getDocumentDefaults("about");const initial={key:"about",revision:3,draft,published:draft,published_at:null,updated_at:"2026-10-23"};
 vi.mocked(readDocument).mockResolvedValue({ok:true,document:initial,versions:[]});
 vi.mocked(previewDocument).mockResolvedValue({ok:true,content:{title:"서버 확인 미리보기"}});
 vi.mocked(readDocumentHistory).mockResolvedValue({ok:true,versions:[{id:"version-1",document_key:"about",revision:1,content:draft,created_at:"2026-10-20"}],total:21});
 vi.mocked(restoreDocument).mockResolvedValue({ok:true,document:{...initial,revision:4,draft:{...draft,title:"복원된 제목"}}});
 render(<DocumentEditor documentKey="about"/>);await screen.findByDisplayValue("보이는 결과와 확인 가능한 과정");
 await userEvent.click(screen.getByRole("button",{name:"모바일 미리보기"}));expect(await screen.findByText("서버 확인 미리보기")).toBeVisible();
 await userEvent.click(screen.getByRole("button",{name:"게시 이력"}));await screen.findByRole("button",{name:"초안으로 복원"});
 await userEvent.click(screen.getByRole("button",{name:"다음 이력"}));expect(readDocumentHistory).toHaveBeenLastCalledWith("about",2);
 await userEvent.click(screen.getByRole("button",{name:"초안으로 복원"}));expect(restoreDocument).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole("button",{name:"복원 확인"}));expect(restoreDocument).toHaveBeenCalledWith("about",3,"version-1");
 expect(await screen.findByDisplayValue("복원된 제목")).toBeVisible();expect(screen.getByRole("status")).toHaveTextContent("검토 후 게시");
});
it.each([["hidden","비공개"],["published","게시 중"]])("shows actual announcement publication status %s",async(status,label)=>{
 const draft=getDocumentDefaults("announcement:visibility");
 vi.mocked(readDocument).mockResolvedValue({ok:true,document:{key:"announcement:visibility",revision:1,draft,published:{...draft,status},published_at:"2026-10-23",updated_at:"2026-10-23"},versions:[]});
 render(<DocumentEditor documentKey="announcement:visibility"/>);
 expect(await screen.findByText(label,{exact:true})).toBeVisible();
});

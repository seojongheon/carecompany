"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/server";
import { documentKind, getDocumentDefaults, validateDocument, type ContentDocument, type ContentVersion, type DocumentBody } from "../model/documents";

function failure(error: unknown) { const message = error instanceof Error ? error.message : "문서를 처리하지 못했습니다."; return { ok: false as const, error: message.includes("content_revision_conflict") ? "다른 관리자가 변경했습니다. 입력 내용은 유지됩니다. 최신 문서를 확인한 뒤 다시 적용해 주세요." : message, conflict: message.includes("content_revision_conflict") }; }
export async function readDocument(key: string) {
  try {
    if (!documentKind(key)) throw new Error("지원하지 않는 문서입니다.");
    const { client } = await requireStaff(key === "settings");
    const [document, versions] = await Promise.all([client.from("content_documents").select("*").eq("key",key).maybeSingle(), client.from("content_document_versions").select("*").eq("document_key",key).order("created_at",{ ascending:false }).limit(20)]);
    if (document.error || versions.error) throw new Error(document.error?.message ?? versions.error?.message);
    let choices: { cases:Array<{id:string;title:string}>; faqs:Array<{id:string;title:string}> } | undefined;
    if(key.startsWith("service:")||key==="home"){
      const [cases,faq]=await Promise.all([client.from("portfolio_cases").select("id,title").eq("status","published").order("published_at",{ascending:false}).limit(500),client.from("content_documents").select("draft").eq("key","faq").maybeSingle()]);
      if(cases.error||faq.error)throw new Error("연결할 공개 사례와 FAQ를 불러오지 못했습니다.");
      choices={cases:cases.data??[],faqs:((faq.data?.draft?.items??[]) as Array<{id:string;question:string}>).map(item=>({id:item.id,title:item.question}))};
    }
    const value = document.data as ContentDocument | null;
    if (!value && !key.startsWith("announcement:")) throw new Error("문서가 없습니다. 데이터베이스 마이그레이션 상태를 확인해 주세요.");
    return { ok: true as const, ...(choices?{choices}:{}), document: value ? { ...value, draft: { ...getDocumentDefaults(key), ...value.draft } } : { key, revision:0, draft:getDocumentDefaults(key), published:null, published_at:null, updated_at:"" } as ContentDocument, versions: (versions.data ?? []) as ContentVersion[] };
  } catch (error) { return failure(error); }
}
export async function listAnnouncements(query="",page=1) {
  try { const { client } = await requireStaff(); let request = client.from("content_documents").select("key,draft,published,published_at,revision,updated_at",{count:"exact"}).like("key","announcement:%").order("updated_at",{ascending:false}); if(query.trim())request=request.ilike("draft->>title",`%${query.trim().replace(/[%_]/g,"")}%`); const result=await request.range((Math.max(1,page)-1)*20,Math.max(1,page)*20-1); if (result.error) throw new Error(result.error.message); return {ok:true as const, documents:result.data as ContentDocument[],total:result.count??0}; } catch(error) { return failure(error); }
}
export async function saveDocument(key:string, revision:number, body:DocumentBody) {
  try { const {client}=await requireStaff(key==="settings"||key==="policy"); const parsed=validateDocument(key,body); if(!parsed.ok) throw new Error(parsed.issues.join("\n")); const result=await client.rpc("save_content_document",{document_key:key,expected_revision:revision,content:parsed.data}); if(result.error) throw new Error(result.error.message); return {ok:true as const,document:result.data as ContentDocument}; } catch(error){return failure(error);}
}
export async function publishDocument(key:string,revision:number) {
  try { const {client}=await requireStaff(key==="settings"||key==="policy"); const result=await client.rpc("publish_content_document",{document_key:key,expected_revision:revision}); if(result.error) throw new Error(result.error.message); revalidatePath("/","layout"); return {ok:true as const,document:result.data as ContentDocument}; } catch(error){return failure(error);}
}
export async function restoreDocument(key:string,revision:number,versionId:string) {
  try { const {client}=await requireStaff(key==="settings"||key==="policy"); const result=await client.rpc("restore_content_document",{document_key:key,expected_revision:revision,version_id:versionId}); if(result.error) throw new Error(result.error.message); return {ok:true as const,document:result.data as ContentDocument}; } catch(error){return failure(error);}
}
export async function previewDocument(key:string,body:DocumentBody) {
  try { const {client}=await requireStaff(key==="settings");const parsed=validateDocument(key,body);if(!parsed.ok)throw new Error(parsed.issues.join("\n"));const {resolveContentImages}=await import("../repository/supabase-site-content-repository");const value=structuredClone(parsed.data);await resolveContentImages(value,client);return{ok:true as const,content:value};}catch(error){return failure(error);}
}

export async function readDocumentHistory(key:string,page=1){
 try{const{client}=await requireStaff(key==="settings");const safePage=Math.max(1,Math.min(10000,Math.trunc(page)||1));const result=await client.from("content_document_versions").select("*",{count:"exact"}).eq("document_key",key).order("created_at",{ascending:false}).range((safePage-1)*20,safePage*20-1);if(result.error)throw new Error(result.error.message);return{ok:true as const,versions:result.data as ContentVersion[],total:result.count??0};}catch(error){return failure(error);}
}

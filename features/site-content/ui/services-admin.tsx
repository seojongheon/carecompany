"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmDocumentNavigation, DocumentEditor } from "./document-editor";
const documents=[["pricing","가격 안내"],["service:bathroom","화장실"],["service:aircon","에어컨"],["service:apartment-window","아파트 유리창"],["service:commercial-window","상가 유리창"]];
export function ServicesAdmin(){
 const params=useSearchParams();const router=useRouter();const selected=params.get("document");
 const key=documents.some(([value])=>value===selected)?selected!:"pricing";
 function select(value:string){if(value===key||!confirmDocumentNavigation())return;const next=new URLSearchParams(params);next.set("document",value);router.replace(`/admin/services?${next}` as never);}
 return <div className="admin-page space-y-6"><header className="admin-page-header"><div><h1>서비스·가격 관리</h1><p className="mt-2 text-sm text-slate-500">서비스 설명과 가격을 관리합니다. 문서별로 저장하고 게시할 수 있습니다.</p></div></header><nav aria-label="서비스 문서" className="admin-tabs flex flex-wrap gap-2">{documents.map(([value,label])=><Button key={value} aria-current={key===value?"page":undefined} variant={key===value?"primary":"ghost"} onClick={()=>select(value)}>{label}</Button>)}</nav><DocumentEditor key={key} documentKey={key}/></div>;
}

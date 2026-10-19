"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmDocumentNavigation, DocumentEditor } from "./document-editor";
export function ServicesAdmin(){const[key,setKey]=useState("pricing");return <div className="mx-auto max-w-5xl space-y-6"><h1 className="text-3xl font-black">서비스·가격 관리</h1><p>네 가지 서비스의 경로는 유지됩니다. 서비스별로 가격 항목을 여러 개 추가할 수 있습니다.</p><nav aria-label="서비스 문서" className="flex flex-wrap gap-2">{[["pricing","가격 안내"],["service:bathroom","화장실"],["service:aircon","에어컨"],["service:apartment-window","아파트 유리창"],["service:commercial-window","상가 유리창"]].map(([value,label])=><Button key={value} variant={key===value?"primary":"secondary"} onClick={()=>{if(confirmDocumentNavigation())setKey(value);}}>{label}</Button>)}</nav><DocumentEditor key={key} documentKey={key}/></div>;}

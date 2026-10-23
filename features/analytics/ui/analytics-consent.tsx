"use client";
import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useOptionalAuth } from "@/features/auth/repository/auth-provider";
import { Button } from "@/components/ui/button";
import { ANALYTICS_CONSENT_KEY, ANALYTICS_VISITOR_KEY, ANALYTICS_VISIT_KEY, buildAnalyticsEvent, nextVisit } from "../model/events";

function readConsent(): "unknown"|"yes"|"no" {try {const value=localStorage.getItem(ANALYTICS_CONSENT_KEY);return value==="yes"?"yes":value==="no"?"no":"unknown";}catch{return "no";}}
function subscribeConsent(listener:()=>void) {window.addEventListener("storage",listener);window.addEventListener("analytics-consent-change",listener);return()=>{window.removeEventListener("storage",listener);window.removeEventListener("analytics-consent-change",listener);};}
const subscribeReady=()=>()=>{};
export function AnalyticsConsent() {
 const pathname=usePathname();const auth=useOptionalAuth();
 const consent=useSyncExternalStore(subscribeConsent,readConsent,()=>"unknown");const ready=useSyncExternalStore(subscribeReady,()=>true,()=>false);const [open,setOpen]=useState(false);
 const lastPage=useRef<string|null>(null);
 const choose=useCallback((value:"yes"|"no")=>{try{localStorage.setItem(ANALYTICS_CONSENT_KEY,value);if(value==="no"){localStorage.removeItem(ANALYTICS_VISITOR_KEY);localStorage.removeItem(ANALYTICS_VISIT_KEY);}}catch{}window.dispatchEvent(new Event("analytics-consent-change"));setOpen(false);lastPage.current=null;},[]);
 useEffect(()=>{
  if(!ready||consent!=="yes"||lastPage.current===pathname)return;
  const isStaff=auth?.session?.role==="admin"||auth?.session?.role==="super_admin";
  if(isStaff)return;
  try{
   const now=Date.now();let visitor: {id:string;createdAt:number}|null=null;let previous:{id:string;lastSeen:number}|null=null;
   try{visitor=JSON.parse(localStorage.getItem(ANALYTICS_VISITOR_KEY)??"null");previous=JSON.parse(localStorage.getItem(ANALYTICS_VISIT_KEY)??"null");}catch{}
   if(!visitor||now-visitor.createdAt>90*86400_000||typeof visitor.id!=="string")visitor={id:crypto.randomUUID(),createdAt:now};
   const sessionId=nextVisit(previous,now,crypto.randomUUID());
   const event=buildAnalyticsEvent({consent:true,isStaff,path:pathname,visitorId:visitor.id,sessionId,referrer:document.referrer,userAgent:navigator.userAgent,search:window.location.search});
   if(!event)return;
   if(event.referrer===window.location.hostname)event.referrer="direct";
   localStorage.setItem(ANALYTICS_VISITOR_KEY,JSON.stringify(visitor));localStorage.setItem(ANALYTICS_VISIT_KEY,JSON.stringify({id:sessionId,lastSeen:now}));
   lastPage.current=pathname;
   const abort=new AbortController();
   void fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(event),signal:abort.signal}).catch(()=>{});
   return()=>abort.abort();
  }catch{/* Storage unavailable: no analytics collection. */}
 },[pathname,consent,ready,auth?.session?.role]);
 if(!ready)return null;
 return <><button type="button" className="mx-auto mb-3 block min-h-11 px-4 text-xs text-[var(--neutral-500)] underline" onClick={()=>setOpen(!open)}>방문 분석 설정</button>{(consent==="unknown"||open)&&<section aria-label="방문 분석 동의" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-lg rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-xl"><h2 className="font-bold">방문 분석에 동의하시겠어요?</h2><p className="mt-2 text-sm leading-6 text-[var(--neutral-600)]">페이지 이용 현황을 알아보기 위해 임의의 브라우저 식별자와 방문 기록을 최대 90일 동안 사용합니다. 계정이나 문의 내용과 연결하지 않습니다. 거부해도 사이트를 이용할 수 있습니다.</p><div className="mt-4 flex flex-wrap gap-2"><Button onClick={()=>choose("yes")}>동의</Button><Button variant="secondary" onClick={()=>choose("no")}>{consent==="yes"?"동의 철회":"거부"}</Button>{consent!=="unknown"&&<Button variant="ghost" onClick={()=>setOpen(false)}>닫기</Button>}</div></section>}</>;
}

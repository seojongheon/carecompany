"use client";
import { useSiteContent } from "../repository/site-content-provider";
import { Button } from "@/components/ui/button";
export function ContentState(){const{loading,error,retry}=useSiteContent();return error?<div role="alert" className="page-shell py-12"><p>공개 콘텐츠를 불러오지 못했습니다.</p><Button variant="secondary" onClick={()=>void retry()}>다시 시도</Button></div>:loading?<p role="status" className="page-shell py-12">콘텐츠를 불러오는 중…</p>:null;}

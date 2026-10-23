import type {Metadata} from "next";
import {InquiryForm} from "@/features/inquiries/ui/inquiry-form";
export const metadata:Metadata={title:"견적 문의",description:"현장 사진과 문의 내용을 남겨 주세요. 담당자가 확인 후 연락드립니다."};
export default function InquiryPage(){return <main id="main-content" className="page-shell py-12"><section className="mx-auto max-w-2xl"><p className="text-sm font-black text-[var(--brand-700)]">상담 · 견적 문의</p><h1 className="mt-2 text-3xl font-black tracking-tight">어떤 공간을 청소할까요?</h1><p className="mb-8 mt-4 leading-7 text-[var(--neutral-600)]">로그인 없이도 문의할 수 있습니다. 현장 사진을 함께 남겨 주시면 상담에 도움이 됩니다.</p><InquiryForm/></section></main>;}

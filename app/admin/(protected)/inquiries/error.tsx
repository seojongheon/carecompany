"use client";
export default function InquiryError({reset}:{reset:()=>void}){return <section role="alert" className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">문의를 불러오지 못했습니다</h2><p className="mt-3 text-sm">연결 상태를 확인하고 다시 시도해 주세요.</p><button onClick={reset} className="mt-5 min-h-11 rounded-lg border px-5 font-bold">다시 시도</button></section>;}

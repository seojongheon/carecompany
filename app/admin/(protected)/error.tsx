"use client";
import { Button } from "@/components/ui/button";
export default function AdminError({reset}:{reset:()=>void}) { return <section role="alert" className="rounded-2xl border border-red-200 bg-white p-8"><h1 className="text-xl font-bold">운영 데이터를 불러오지 못했습니다</h1><p className="my-4 text-[var(--neutral-600)]">연결 상태와 데이터베이스 설정을 확인한 뒤 다시 시도해 주세요.</p><Button onClick={reset}>다시 시도</Button></section>; }

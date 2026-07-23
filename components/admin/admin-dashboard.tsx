"use client";

import { Eye, EyeOff, Images, Layers3 } from "lucide-react";

import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";

export function AdminDashboard() {
  const { snapshot } = usePortfolio();
  const active = snapshot.cases.filter(({ status }) => status !== "deleted");
  const stats = [
    { label: "전체 사례", value: active.length, icon: Layers3 },
    { label: "공개 사례", value: active.filter(({ status }) => status === "published").length, icon: Eye },
    { label: "비공개 초안", value: active.filter(({ status }) => status === "private").length, icon: EyeOff },
    { label: "등록 사진", value: snapshot.media.length, icon: Images },
  ];
  return <div><div><p className="text-sm font-black text-[var(--brand-700)]">ADMIN MOCK</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">관리자 대시보드</h1><p className="mt-2 text-[var(--neutral-500)]">로그인 없이 로컬 목업 데이터를 관리합니다.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Glyph }) => <article className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5" key={label}><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]"><Glyph aria-hidden="true" /></span><p className="mt-5 text-sm font-bold text-[var(--neutral-500)]">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></article>)}</div><section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-900">프런트엔드 목업 모드</h2><p className="mt-1 text-sm text-amber-800">인증·서버·DB·원격 스토리지는 연결하지 않았습니다. 텍스트 상태는 이 브라우저에만 저장되고 선택 사진은 새로고침하면 목업 이미지로 복원됩니다.</p></section></div>;
}

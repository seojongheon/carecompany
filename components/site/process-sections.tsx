import Link from "next/link";
import { Camera, CheckCircle2, ClipboardList, Droplets, Eye, MapPinCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  [ClipboardList, "요청 내용 확인", "필요한 서비스와 공간, 불편한 점을 먼저 확인합니다."],
  [Camera, "사진과 범위 확인", "재질과 오염 상태를 보고 작업 가능 범위를 나눕니다."],
  [MapPinCheck, "현장 조건 점검", "동선, 물 사용, 안전한 접근 조건을 확인합니다."],
  [ShieldCheck, "보호와 준비", "주변 물품과 작업 구역을 구분하고 필요한 보호 조치를 합니다."],
  [Droplets, "구역별 작업", "오염과 재질에 맞는 도구로 정한 순서에 따라 진행합니다."],
  [Eye, "상태 재확인", "놓친 부분과 물기, 주변 정리 상태를 다시 살핍니다."],
  [CheckCircle2, "결과 안내", "작업한 범위와 관리 시 주의할 점을 정리해 안내합니다."],
] as const;

export function ProcessSections() {
  return <main id="main-content"><section className="border-b border-[var(--neutral-200)]"><div className="page-shell py-16"><span className="eyebrow">HOW WE WORK</span><h1 className="page-title">확인부터 마무리까지</h1><p className="page-lead max-w-2xl">현장마다 방법은 달라도, 범위를 확인하고 안전하게 작업한 뒤 결과를 다시 살피는 기본 흐름은 지킵니다.</p></div></section><section className="section-space"><div className="page-shell"><ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{steps.map(([Glyph, title, description], index) => <li data-testid="process-step" className="relative rounded-2xl border border-[var(--neutral-200)] p-6" key={title}><span className="absolute right-5 top-4 text-5xl font-black text-[var(--neutral-100)]">{String(index + 1).padStart(2, "0")}</span><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]"><Glyph aria-hidden="true" /></span><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-[var(--neutral-600)]">{description}</p></li>)}</ol></div></section><section className="section-space bg-[var(--neutral-50)]"><div className="page-shell"><h2 className="text-3xl font-black">서비스별로 달라지는 점</h2><div className="mt-7 grid gap-5 md:grid-cols-2"><article className="rounded-2xl bg-white p-6"><h3 className="text-xl font-bold">화장실·에어컨</h3><p className="mt-2 text-[var(--neutral-600)]">화장실은 표면 재질과 틈새 오염, 에어컨은 기기 형태와 분해 가능한 범위가 작업 방법을 좌우합니다.</p></article><article className="rounded-2xl bg-white p-6"><h3 className="text-xl font-bold">아파트·상가 유리창</h3><p className="mt-2 text-[var(--neutral-600)]">창 구조와 높이, 외부 접근 안전성, 거주·영업 동선을 확인해 가능한 범위를 정합니다.</p></article></div><Button asChild className="mt-8"><Link href="/portfolio">실제 작업 사례 보기</Link></Button></div></section></main>;
}


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "위생의 기술 소개", description: "보이는 결과와 확인 가능한 과정을 중요하게 생각하는 위생의 기술을 소개합니다.", path: "/about" });

export default function AboutPage() {
  return <main id="main-content"><section className="page-shell py-16"><span className="eyebrow">ABOUT</span><h1 className="page-title">보이는 결과와<br />확인 가능한 과정</h1><p className="page-lead max-w-2xl">위생의 기술은 천안·아산을 중심으로 화장실, 에어컨, 아파트와 상가 유리창 청소 사례를 정리합니다.</p></section><section className="section-space bg-[var(--neutral-50)]"><div className="page-shell grid gap-6 lg:grid-cols-3"><article className="rounded-2xl bg-white p-7"><h2 className="text-xl font-black">필요한 범위부터</h2><p className="mt-3 text-[var(--neutral-600)]">과도한 약속보다 현장 상태와 가능한 작업 범위를 먼저 확인합니다.</p></article><article className="rounded-2xl bg-white p-7"><h2 className="text-xl font-black">과정이 남도록</h2><p className="mt-3 text-[var(--neutral-600)]">작업 전·과정·후 사진을 구분해 결과를 쉽게 비교할 수 있게 합니다.</p></article><article className="rounded-2xl bg-white p-7"><h2 className="text-xl font-black">공개는 조심스럽게</h2><p className="mt-3 text-[var(--neutral-600)]">사람, 주소, 차량과 개인 물품이 드러나지 않는지 확인한 자료만 공개합니다.</p></article></div></section><section className="page-shell py-16 text-center"><h2 className="text-3xl font-black">작업 사례로 확인해 보세요</h2><Button asChild className="mt-6"><Link href="/portfolio">전체 사례 보기</Link></Button></section></main>;
}

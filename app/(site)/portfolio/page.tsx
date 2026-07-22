import { Suspense } from "react";
import { PortfolioBrowser } from "@/features/portfolio/ui/portfolio-browser";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "전체 작업 사례", description: "위생의 기술이 공개 검토한 천안·아산 청소 작업 사례를 살펴보세요.", path: "/portfolio" });

export default function PortfolioPage() {
  return <main id="main-content" className="page-shell py-14"><span className="eyebrow">PORTFOLIO</span><h1 className="page-title">전체 작업 사례</h1><p className="page-lead">네 서비스의 공개 사례를 조건별로 살펴보세요.</p><div className="mt-10"><Suspense fallback={<Skeleton className="h-96 w-full" />}><PortfolioBrowser initialLimit={9} /></Suspense></div></main>;
}

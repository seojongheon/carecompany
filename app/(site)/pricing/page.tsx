import { PricingSections } from "@/components/site/pricing-sections";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ title: "가격 안내", description: "청소 서비스별 샘플 가격과 현장 확인 조건을 안내합니다.", path: "/pricing" });
export default function PricingPage() { return <PricingSections />; }

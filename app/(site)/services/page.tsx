import { ServiceCard } from "@/components/site/service-card";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "청소 서비스", description: "천안·아산 화장실, 에어컨, 아파트·상가 유리창 청소 서비스를 확인하세요.", path: "/services" });

export default function ServicesPage() {
  return <main id="main-content" className="page-shell py-14"><span className="eyebrow">SERVICES</span><h1 className="page-title">청소 서비스</h1><p className="page-lead">현장에 맞는 네 가지 서비스를 한 번에 살펴보세요.</p><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{SEED_SNAPSHOT.services.map((service) => <ServiceCard service={service} key={service.id} />)}</div></main>;
}

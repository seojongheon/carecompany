import { ProcessSections } from "@/components/site/process-sections";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ title: "작업 과정", description: "문의부터 현장 확인과 청소, 공개 검토까지의 과정을 안내합니다.", path: "/process" });
export default function ProcessPage() { return <ProcessSections />; }

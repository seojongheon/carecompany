import { ProcessSections } from "@/components/site/process-sections";
import { getPublishedContent } from "@/features/site-content/server/public-content";
import { createPageMetadata } from "@/lib/metadata";
export async function generateMetadata(){const content=await getPublishedContent();return createPageMetadata({title:content.process?.title??"작업 과정",description:content.process?.description??"서비스 작업 과정을 안내합니다.",path:"/process"});}
export default function ProcessPage() { return <ProcessSections />; }

import { PolicyContent } from "@/features/site-content/ui/public-pages";
import { getPublishedContent } from "@/features/site-content/server/public-content";
import { createPageMetadata } from "@/lib/metadata";
export async function generateMetadata(){const content=await getPublishedContent();return createPageMetadata({title:content.policy?.title??"개인정보처리방침",description:content.settings.seoDescription??"개인정보 처리 목적과 권리 행사 방법을 안내합니다.",path:"/privacy"});}
export default function Page(){return <PolicyContent/>;}

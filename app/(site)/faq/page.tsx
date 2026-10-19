import { FaqContent } from "@/features/site-content/ui/public-pages";
import { createPageMetadata } from "@/lib/metadata";
export const metadata=createPageMetadata({title:"자주 묻는 질문",description:"청소 서비스와 가격에 관한 자주 묻는 질문입니다.",path:"/faq"});
export default function Page(){return <FaqContent/>;}

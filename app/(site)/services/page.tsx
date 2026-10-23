import { ServicesContent } from "@/features/site-content/ui/public-pages";
import { createPageMetadata } from "@/lib/metadata";
export const metadata=createPageMetadata({title:"청소 서비스",description:"천안·아산 청소 서비스를 확인하세요.",path:"/services"});
export default function Page(){return <ServicesContent/>;}

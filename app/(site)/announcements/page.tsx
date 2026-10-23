import { AnnouncementsContent } from "@/features/site-content/ui/public-pages";
import { createPageMetadata } from "@/lib/metadata";
export const metadata=createPageMetadata({title:"공지사항",description:"위생의 기술의 운영 소식과 공지사항입니다.",path:"/announcements"});
export default function Page(){return <AnnouncementsContent/>;}

import { AboutContent } from "@/features/site-content/ui/public-pages";
import { getPublishedContent } from "@/features/site-content/server/public-content";
import { createPageMetadata } from "@/lib/metadata";
export async function generateMetadata(){const content=await getPublishedContent();return createPageMetadata({title:content.about.title,description:content.about.description,path:"/about"});}
export default function Page(){return <AboutContent/>;}

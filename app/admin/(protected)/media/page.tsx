import { Suspense } from "react";
import { MediaLibrary } from "@/features/media/media-library";
export default function MediaPage(){return <Suspense fallback={<p>미디어를 불러오는 중…</p>}><MediaLibrary/></Suspense>;}

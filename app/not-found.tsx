import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main id="main-content" className="page-shell grid min-h-[70dvh] place-items-center py-16 text-center"><div><SearchX aria-hidden="true" className="mx-auto text-[var(--brand-600)]" size={58} /><h1 className="mt-6 text-4xl font-black">페이지를 찾을 수 없습니다</h1><p className="mt-3 text-[var(--neutral-500)]">주소가 바뀌었거나 공개되지 않은 콘텐츠일 수 있습니다.</p><Button asChild className="mt-7"><Link href="/">홈으로 돌아가기</Link></Button></div></main>;
}

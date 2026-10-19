import Link from "next/link";
import { MessageCircle } from "lucide-react";
export function EstimateFab() {
  return <Link href="/inquiry" aria-label="견적 문의" className="estimate-fab fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-5 z-30 flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-600)] px-5 font-bold text-white shadow-xl"><MessageCircle aria-hidden="true" size={20} /><span className="hidden sm:inline">견적 문의</span></Link>;
}

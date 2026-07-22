import { MessageCircle } from "lucide-react";

export function EstimateFab() {
  return <button type="button" aria-label="사진 견적 열기 (준비 중)" title="견적 기능은 추후 연결됩니다" className="estimate-fab fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-5 z-30 flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-600)] px-5 font-bold text-white shadow-xl"><MessageCircle aria-hidden="true" size={20} /><span className="hidden sm:inline">견적 문의</span></button>;
}

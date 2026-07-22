import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { PublicCaseDetail } from "@/features/portfolio/model/types";

export function CaseMetadata({ detail }: { detail: PublicCaseDetail }) {
  return <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--neutral-600)]"><div className="flex items-center gap-2"><MapPin aria-hidden="true" size={17} /><dt className="sr-only">지역</dt><dd>{detail.locationDisplay}</dd></div><div className="flex items-center gap-2"><CalendarDays aria-hidden="true" size={17} /><dt className="sr-only">작업 시기</dt><dd>{detail.displayPeriod}</dd></div><div className="flex items-center gap-2"><Sparkles aria-hidden="true" size={17} /><dt className="sr-only">서비스</dt><dd>{detail.service.name}</dd></div></dl>;
}


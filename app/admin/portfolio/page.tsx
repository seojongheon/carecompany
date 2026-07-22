import { AdminCaseList } from "@/features/portfolio/ui/admin-case-list";

export default function AdminPortfolioPage() { return <div><h1 className="text-3xl font-black">사례 관리</h1><p className="mt-2 text-[var(--neutral-500)]">공개 상태와 서비스별로 목업 사례를 관리합니다.</p><AdminCaseList /></div>; }


import { AdminCaseList } from "@/features/portfolio/ui/admin-case-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function AdminPortfolioPage() { return <div className="admin-page"><AdminPageHeader title="시공 사례" description="공개 상태와 서비스별로 사례를 관리합니다." /><AdminCaseList /></div>; }

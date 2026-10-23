import { Suspense } from "react";
import { SiteContentAdmin } from "@/features/site-content/ui/site-content-admin";
import { requireStaff } from "@/lib/admin/server";
export default async function SiteAdminPage(){const{context}=await requireStaff();return <Suspense fallback={<p>문서를 불러오는 중…</p>}><SiteContentAdmin master={context.canManageAdministrators}/></Suspense>;}

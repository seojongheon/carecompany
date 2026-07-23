import { redirect } from "next/navigation";

import { AdminAppBar } from "@/components/admin/admin-app-bar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RecoveryNotice } from "@/components/admin/recovery-notice";
import { getServerAuthContext } from "@/features/auth/server/authorization";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getServerAuthContext();
  if (!context?.canAccessAdmin) redirect("/admin/login");

  return <div className="min-h-dvh bg-[var(--neutral-50)]"><AdminSidebar /><AdminAppBar /><main id="main-content" className="p-4 pb-20 lg:ml-64 lg:p-10"><RecoveryNotice />{children}</main></div>;
}

import { AdminAppBar } from "@/components/admin/admin-app-bar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RecoveryNotice } from "@/components/admin/recovery-notice";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGuard><div className="min-h-dvh bg-[var(--neutral-50)]"><AdminSidebar /><AdminAppBar /><main id="main-content" className="p-4 pb-20 lg:ml-64 lg:p-10"><RecoveryNotice />{children}</main></div></AdminAuthGuard>;
}

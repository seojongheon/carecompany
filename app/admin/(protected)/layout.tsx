import { NotificationInbox } from "@/features/notifications/ui/notification-inbox";
import { redirect } from "next/navigation";

import { AdminAppBar } from "@/components/admin/admin-app-bar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RecoveryNotice } from "@/components/admin/recovery-notice";
import { getServerAuthContext } from "@/features/auth/server/authorization";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getServerAuthContext();
  if (!context?.canAccessAdmin) redirect("/admin/login");

  return <div className="admin-shell"><AdminSidebar role={context.role} /><AdminAppBar role={context.role} email={context.email} notifications={<NotificationInbox />} /><main id="main-content" className="admin-main"><RecoveryNotice />{children}</main></div>;
}

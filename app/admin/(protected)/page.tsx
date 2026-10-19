import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { loadDashboard } from "@/features/admin/dashboard/queries";
export default async function AdminPage(){return <AdminDashboard data={await loadDashboard()}/>;}

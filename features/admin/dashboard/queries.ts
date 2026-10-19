import { requireStaff } from "@/lib/admin/server";
import { dateDaysAgo,seoulDate,type VisitReport } from "@/features/analytics/model/report";
export interface DashboardData { date:string; cases:{total:number;published:number;private:number;drafts:number;media:number};inquiries:{new:number;open:number;mine:number;unassigned:number};pendingContent:number;failedUploads:number;failedCleanup:number;visits:VisitReport;recentCases:Array<{id:string;title:string;updated_at:string}>;recentInquiries:Array<{id:string;receipt_number:string;status:string;created_at:string}>;recentContent:Array<{key:string;published_at:string}>; }
export async function loadDashboard():Promise<DashboardData>{
 const {client}=await requireStaff();
 const queries=await Promise.all([
  client.from("portfolio_cases").select("id",{count:"exact",head:true}).neq("status","deleted"),
  client.from("portfolio_cases").select("id",{count:"exact",head:true}).eq("status","published"),
  client.from("portfolio_cases").select("id",{count:"exact",head:true}).eq("status","private"),
  client.from("case_revision_drafts").select("case_id,portfolio_cases!inner(status)",{count:"exact",head:true}).eq("portfolio_cases.status","published"),
  client.from("case_media").select("id",{count:"exact",head:true}),
  client.rpc("admin_inquiry_counts"),client.rpc("get_visit_report",{date_from:dateDaysAgo(6),date_to:seoulDate()}),
  client.from("content_documents").select("key,draft,published"),
  client.from("media_assets").select("id",{count:"exact",head:true}).eq("status","failed"),
  client.from("media_cleanup_jobs").select("id",{count:"exact",head:true}).eq("status","failed"),
  client.from("portfolio_cases").select("id,title,updated_at").neq("status","deleted").order("updated_at",{ascending:false}).limit(5),
  client.from("inquiries").select("id,receipt_number,status,created_at").neq("status","spam").order("created_at",{ascending:false}).limit(5),
  client.from("content_documents").select("key,published_at").not("published_at","is",null).order("published_at",{ascending:false}).limit(5),
 ]);
 if(queries.some(q=>q.error))throw new Error("운영 현황을 불러오지 못했습니다.");
 return {date:seoulDate(),cases:{total:queries[0].count??0,published:queries[1].count??0,private:queries[2].count??0,drafts:queries[3].count??0,media:queries[4].count??0},inquiries:queries[5].data as unknown as DashboardData["inquiries"],visits:queries[6].data as unknown as VisitReport,pendingContent:(queries[7].data as unknown as Array<{draft:unknown;published:unknown}>).filter(d=>JSON.stringify(d.draft)!==JSON.stringify(d.published)).length,failedUploads:queries[8].count??0,failedCleanup:queries[9].count??0,recentCases:queries[10].data as unknown as DashboardData["recentCases"],recentInquiries:queries[11].data as unknown as DashboardData["recentInquiries"],recentContent:queries[12].data as unknown as DashboardData["recentContent"]};
}

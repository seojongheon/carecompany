import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/server";
import { UsersManager } from "@/features/admin/users/users-manager";
import type { ManagedProfile } from "@/app/actions/roles";
export default async function UserDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))notFound();const {client}=await requireStaff(true);
 const {data,error}=await client.rpc("list_admin_profiles");if(error)throw error;const profile=(data as ManagedProfile[]).find(p=>p.id===id);if(!profile)notFound();
 const logs=await client.from("admin_role_audit_logs").select("id,previous_role,new_role,previous_active,new_active,reason,created_at").eq("target_id",id).order("created_at",{ascending:false}).limit(50);
 return <section><Link className="nav-link" href="/admin/users">← 회원 목록</Link><h1 className="page-title mt-4">회원 상세</h1><UsersManager profiles={[profile]}/><Link className="mt-6 inline-flex min-h-11 items-center rounded-xl border bg-white px-5 font-bold" href={`/admin/inquiries?owner=${id}`}>이 회원의 접수 내역 보기</Link><h2 className="mt-8 text-xl font-bold">최근 계정 변경 이력</h2>{logs.error?<p role="alert">이력을 조회하지 못했습니다.</p>:logs.data?.length?<ul className="mt-4 divide-y rounded-2xl border bg-white p-5">{logs.data.map(log=><li className="py-4 text-sm" key={log.id}><p>{log.previous_role} → {log.new_role} · {log.new_active?"활성":"정지"}</p><p className="mt-2">{log.reason}</p><time className="text-xs text-[var(--neutral-500)]">{new Date(log.created_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</time></li>)}</ul>:<p className="mt-4">변경 기록이 없습니다.</p>}</section>;
}

import "server-only";
import {requireStaff} from "@/lib/admin/server";
import {InquiryFilterSchema,type Inquiry,type InquiryAttachment,type InquiryNote,type InquiryChange,type StaffOption} from "../model/inquiry";
export async function listInquiries(filters:unknown){const parsed=InquiryFilterSchema.parse(filters);const {client}=await requireStaff();const {data,error}=await client.rpc("admin_inquiries",{p_filters:parsed});if(error)throw new Error("문의 목록을 불러오지 못했습니다.");return {items:data.items as Inquiry[],total:data.total as number,filters:parsed};}
export async function inquiryStaffOptions():Promise<StaffOption[]>{const {client}=await requireStaff();const {data,error}=await client.rpc("inquiry_staff_options");if(error)throw new Error("담당자 목록을 불러오지 못했습니다.");return data;}
export async function inquiryDetail(id:string){
 const {client}=await requireStaff();
 const results=await Promise.all([client.from("inquiries").select("*").eq("id",id).maybeSingle(),client.from("inquiry_attachments").select("*").eq("inquiry_id",id).order("created_at"),client.from("inquiry_notes").select("*").eq("inquiry_id",id).order("created_at",{ascending:false}),client.from("inquiry_changes").select("*").eq("inquiry_id",id).order("created_at",{ascending:false}),client.rpc("inquiry_staff_options")]);
 if(results.some(result=>result.error))throw new Error("문의 상세 정보를 불러오지 못했습니다.");
 const inquiry=results[0].data as Inquiry|null;if(!inquiry)return null;
 const neighbors=await Promise.all([client.from("inquiries").select("id").gt("created_at",inquiry.created_at).order("created_at",{ascending:true}).limit(1).maybeSingle(),client.from("inquiries").select("id").lt("created_at",inquiry.created_at).order("created_at",{ascending:false}).limit(1).maybeSingle(),client.rpc("admin_read_inquiry",{p_id:id})]);
 if(neighbors.some(result=>result.error))throw new Error("문의 읽음 상태를 갱신하지 못했습니다.");
 return {inquiry,attachments:results[1].data as InquiryAttachment[],notes:results[2].data as InquiryNote[],changes:results[3].data as InquiryChange[],staff:results[4].data as StaffOption[],previous:neighbors[0].data?.id as string|undefined,next:neighbors[1].data?.id as string|undefined};
}

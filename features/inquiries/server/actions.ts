"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {requireStaff} from "@/lib/admin/server";
import {InquiryInputSchema,INQUIRY_STATUSES} from "../model/inquiry";
function safeError(error:unknown){const message=error&&typeof error==="object"&&"message" in error?String(error.message):"";if(message.includes("inquiry_policy_unavailable"))return "게시된 개인정보 수집·이용 안내가 없어 접수할 수 없습니다. 최고 관리자에게 정책 게시를 요청해 주세요.";return message.includes("inquiry_conflict")?"다른 관리자가 변경했습니다. 새로고침 후 다시 확인해 주세요.":"문의 작업에 실패했습니다. 권한과 연결 상태를 확인하고 다시 시도해 주세요.";}
export async function createManualInquiry(input:unknown){
 try{const parsed=InquiryInputSchema.extend({source:z.enum(["phone","kakao"])}).safeParse(input);if(!parsed.success)return {ok:false,error:parsed.error.issues[0]?.message??"입력 내용을 확인해 주세요."};const {client}=await requireStaff();const {data,error}=await client.rpc("admin_create_inquiry",{p_input:parsed.data});if(error)throw error;revalidatePath("/admin/inquiries");return {ok:true,id:data.id as string,receiptNumber:data.receiptNumber as string};}catch(error){return {ok:false,error:safeError(error)};}
}
export async function updateInquiry(input:unknown){
 try{const parsed=z.object({id:z.uuid(),status:z.enum(INQUIRY_STATUSES),assigneeId:z.uuid().nullable(),updatedAt:z.iso.datetime({offset:true})}).parse(input);const {client}=await requireStaff();const {error}=await client.rpc("admin_update_inquiry",{p_id:parsed.id,p_status:parsed.status,p_assignee:parsed.assigneeId,p_expected_updated_at:parsed.updatedAt});if(error)throw error;revalidatePath("/admin/inquiries");return {ok:true};}catch(error){return {ok:false,error:safeError(error)};}
}
export async function addInquiryNote(input:unknown){
 try{const parsed=z.object({id:z.uuid(),body:z.string().trim().min(1).max(5000)}).parse(input);const {client}=await requireStaff();const {error}=await client.rpc("admin_add_inquiry_note",{p_id:parsed.id,p_body:parsed.body});if(error)throw error;revalidatePath(`/admin/inquiries/${parsed.id}`);return {ok:true};}catch(error){return {ok:false,error:safeError(error)};}
}

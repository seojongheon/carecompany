import { z } from "zod";
import { SERVICE_KEYS } from "@/features/portfolio/model/types";
export const INQUIRY_STATUSES = ["new", "consulting", "on_hold", "completed", "spam"] as const;
export type InquiryStatus = typeof INQUIRY_STATUSES[number];
export const STATUS_LABELS: Record<InquiryStatus, string> = { new:"신규", consulting:"상담 중", on_hold:"보류", completed:"완료", spam:"스팸" };
export const SERVICE_LABELS: Record<string,string> = { bathroom:"욕실", aircon:"에어컨", "apartment-window":"아파트 창", "commercial-window":"상업시설 창" };
export const InquiryInputSchema = z.object({
 name:z.string().trim().min(1,"이름을 입력해 주세요.").max(80),
 phone:z.string().trim().transform(v=>v.replace(/[\s()-]/g,"")).pipe(z.string().regex(/^\+?[0-9]{8,15}$/, "전화번호를 확인해 주세요.")),
 service:z.enum(SERVICE_KEYS), region:z.string().trim().min(1,"지역을 입력해 주세요.").max(160),
 message:z.string().trim().min(1,"문의 내용을 입력해 주세요.").max(5000), consent:z.literal(true, {error:"개인정보 수집·이용에 동의해 주세요."}), idempotencyKey:z.uuid(),
});
export type InquiryInput = z.infer<typeof InquiryInputSchema>;
export const InquiryFilterSchema = z.object({
 page:z.coerce.number().int().min(1).max(100000).default(1),q:z.string().trim().max(100).default(""),
 status:z.enum([...INQUIRY_STATUSES,"open"]).optional(),service:z.enum(SERVICE_KEYS).optional(),source:z.enum(["web","phone","kakao"]).optional(),
 owner:z.uuid().optional(),assignee:z.union([z.uuid(),z.literal("unassigned"),z.literal("mine")]).optional(),unread:z.enum(["true"]).optional(),
 from:z.iso.date().optional(),to:z.iso.date().optional(),sort:z.enum(["newest","oldest"]).default("newest"),
});
export type InquiryFilter = z.infer<typeof InquiryFilterSchema>;
export function validateAttachmentMetadata(files: readonly {size:number;type:string}[]):string|null {
 if(files.length>5)return "사진은 최대 5장까지 첨부할 수 있습니다.";
 if(files.some(file=>file.size<1||file.size>10*1024*1024))return "사진 한 장은 10MiB 이하여야 합니다.";
 if(files.some(file=>!["image/jpeg","image/png","image/webp"].includes(file.type)))return "JPEG, PNG, WebP 사진만 첨부할 수 있습니다.";
 return null;
}
export function customerStatus(status:InquiryStatus){return ({new:"접수 완료",consulting:"상담 중",on_hold:"확인 중",completed:"처리 완료",spam:"접수 완료"} as const)[status];}
export interface Inquiry {id:string;receipt_number:string;name:string;phone:string;service:string;region:string;message:string;status:InquiryStatus;source:"web"|"phone"|"kakao";assignee_id:string|null;customer_id:string|null;created_at:string;updated_at:string;is_unread?:boolean;}
export interface InquiryAttachment {id:string;inquiry_id:string;file_name:string;mime_type:string;size_bytes:number;storage_path:string;}
export interface InquiryNote {id:string;body:string;actor_id:string;created_at:string;}
export interface InquiryChange {id:string;action:string;summary:string;actor_id:string|null;created_at:string;}
export interface StaffOption {id:string;email:string;}

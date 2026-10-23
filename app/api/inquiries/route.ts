import { createHmac,createHash,randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerAuthContext } from "@/features/auth/server/authorization";
import { InquiryInputSchema,validateAttachmentMetadata } from "@/features/inquiries/model/inquiry";
import { sanitizeInquiryImage } from "@/features/inquiries/server/images";
export const runtime="nodejs";
const MAX_BODY=3.5*1024*1024;
function reply(body:unknown,status=200){return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});}
async function boundedForm(request:Request){
 if(Number(request.headers.get("content-length"))>MAX_BODY)throw new Error("body_too_large");
 const reader=request.body?.getReader();if(!reader)throw new Error("invalid_body");
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();throw new Error("body_too_large");}chunks.push(value);}
 return new Response(Buffer.concat(chunks),{headers:{"content-type":request.headers.get("content-type")??""}}).formData();
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return reply({error:"허용되지 않은 요청입니다."},403);
 let service:ReturnType<typeof createServiceSupabaseClient>|undefined;let eventKey:string=randomUUID();
 try{
  const form=await boundedForm(request);
  let raw:unknown;try{raw=JSON.parse(String(form.get("input")));}catch{return reply({error:"입력 내용을 확인해 주세요."},400);}
  const parsed=InquiryInputSchema.safeParse(raw);if(!parsed.success)return reply({error:parsed.error.issues[0]?.message??"입력 내용을 확인해 주세요."},400);
  const input=parsed.data;
  const entries=form.getAll("photos");if(entries.some(v=>typeof v==="string"))return reply({error:"첨부 형식이 올바르지 않습니다."},400);
  const photos=entries as File[];const validation=validateAttachmentMetadata(photos);if(validation)return reply({error:validation},400);
  const client=await createServerSupabaseClient();
  const {data:identity,error:identityError}=await client.auth.getUser();
  let customerId:string|null=null;
  if(identity.user){const context=await readServerAuthContext(client as unknown as Parameters<typeof readServerAuthContext>[0]);if(!context?.isActive)return reply({error:"이 계정으로 문의를 접수할 수 없습니다."},403);customerId=context.userId;}
  else if(identityError&&identityError.name!=="AuthSessionMissingError")return reply({error:"로그인 상태 확인에 실패했습니다. 다시 시도해 주세요."},503);
  service=createServiceSupabaseClient();const secret=process.env.SUPABASE_SECRET_KEY;if(!secret)throw new Error("unconfigured");
  const digest=(value:string)=>createHmac("sha256",secret).update(value).digest("hex");
  const key=digest(`submission:${customerId??"guest"}:${input.idempotencyKey}`);eventKey=key;
  const buffers=await Promise.all(photos.map(async(file)=>Buffer.from(await file.arrayBuffer())));
  const fingerprint=createHash("sha256").update(JSON.stringify({...input,customerId,photos:buffers.map((buffer,index)=>({type:photos[index].type,hash:createHash("sha256").update(buffer).digest("hex")}))})).digest("hex");
  const previous=await service.rpc("inquiry_submission_receipt",{p_key:key,p_fingerprint:fingerprint});
  if(previous.error){if(previous.error.message.includes("idempotency_conflict"))return reply({error:"같은 접수 요청의 내용이 변경되었습니다. 새 문의로 다시 접수해 주세요."},409);throw previous.error;}
  if(previous.data)return reply(previous.data);
  const ip=(request.headers.get("x-vercel-forwarded-for")??request.headers.get("x-forwarded-for")??"unknown").split(",")[0].trim();
  const rate=await service.rpc("check_inquiry_submission_rate",{p_rate_key:digest(`ip:${ip}`),p_phone_key:digest(`phone:${input.phone}`)});if(rate.error)throw rate.error;
  const safeImages:Buffer[]=[];
  try{for(let i=0;i<buffers.length;i++)safeImages.push(await sanitizeInquiryImage(buffers[i],photos[i].type));}catch{return reply({error:"사진을 읽을 수 없습니다. JPEG, PNG, WebP 사진을 다시 선택해 주세요."},400);}
  const folder=randomUUID();const attachments=[];
  for(let i=0;i<safeImages.length;i++){
   const storagePath=`${folder}/${randomUUID()}.webp`;
   const registration=await service.rpc("register_inquiry_upload",{p_path:storagePath});if(registration.error)throw registration.error;
   const result=await service.storage.from("inquiry-attachments").upload(storagePath,safeImages[i],{contentType:"image/webp",upsert:false});
   if(result.error)throw result.error;attachments.push({storagePath,fileName:`문의 사진 ${i+1}.webp`,sizeBytes:safeImages[i].byteLength});
  }
  const result=await service.rpc("submit_inquiry",{p_key:key,p_fingerprint:fingerprint,p_rate_key:digest(`ip:${ip}`),p_phone_key:digest(`phone:${input.phone}`),p_customer:customerId,p_input:input,p_attachments:attachments});
  if(result.error)throw result.error;
  return reply({receiptNumber:result.data.receiptNumber},201);
 }catch(error){
  const message=error instanceof Error?error.message:typeof error==="object"&&error!==null&&"message" in error?String(error.message):"";
  // A timed-out RPC may have committed. Deferred cleanup checks references after a grace period.
  if(service&&!message.includes("rate_limited")&&!message.includes("idempotency_conflict")&&!message.includes("inquiry_policy_unavailable")){try{await service.rpc("report_inquiry_failure",{p_event_key:eventKey});}catch{/* Keep the original safe error even when the notification service is unavailable. */}}
  if(message.includes("inquiry_policy_unavailable"))return reply({error:"개인정보 수집·이용 안내를 준비 중입니다. 잠시 후 다시 접수해 주세요."},503);
  if(message.includes("rate_limited"))return reply({error:"접수 횟수가 많습니다. 한 시간 뒤 다시 시도해 주세요."},429);
  if(message.includes("body_too_large"))return reply({error:"첨부 용량이 너무 큽니다."},413);
  if(message.includes("idempotency_conflict"))return reply({error:"같은 접수 요청의 내용이 변경되었습니다. 새 문의로 다시 접수해 주세요."},409);
  return reply({error:"문의 접수에 실패했습니다. 입력 내용을 유지하고 다시 시도해 주세요."},503);
 }
}

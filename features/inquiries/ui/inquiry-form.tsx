"use client";
import Link from "next/link";
import {useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {InquiryInputSchema,SERVICE_LABELS,validateAttachmentMetadata} from "../model/inquiry";
import {createManualInquiry} from "../server/actions";
import {optimizeInquiryPhotos} from "../model/optimize-photos";
import {useSiteContent} from "@/features/site-content/repository/site-content-provider";
const fieldClass="min-h-11 w-full rounded-xl border border-[var(--neutral-300)] bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-[var(--brand-600)]";
export function InquiryForm({manual=false}:{manual?:boolean}){
 const router=useRouter();const request=useRef({key:"",input:""});const optimized=useRef<{originals:File[];files:File[]}|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [receipt,setReceipt]=useState("");const [photos,setPhotos]=useState<File[]>([]);
 const content=useSiteContent();const policy=content.snapshot.published.policy;const consentReady=!content.loading&&!content.error&&policy?.reviewed===true&&Boolean(policy.inquiryConsent.trim());
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!consentReady)return;setError("");const data=new FormData(event.currentTarget);
  const fields={name:data.get("name"),phone:data.get("phone"),service:data.get("service"),region:data.get("region"),message:data.get("message"),consent:data.get("consent")==="on"};
  const snapshot=JSON.stringify({...fields,source:manual?data.get("source"):"web",photos:photos.map(p=>[p.name,p.size,p.lastModified])});if(request.current.input!==snapshot){request.current={key:crypto.randomUUID(),input:snapshot};}
  const parsed=InquiryInputSchema.safeParse({...fields,idempotencyKey:request.current.key});if(!parsed.success){setError(parsed.error.issues[0]?.message??"입력 내용을 확인해 주세요.");return;}
  const fileError=validateAttachmentMetadata(photos);if(fileError){setError(fileError);return;}setBusy(true);
  try{
   if(manual){const result=await createManualInquiry({...parsed.data,source:data.get("source")});if(!result.ok)throw new Error(result.error);router.push(`/admin/inquiries/${result.id}`);router.refresh();return;}
   if(!optimized.current||optimized.current.originals!==photos)optimized.current={originals:photos,files:await optimizeInquiryPhotos(photos)};
   const body=new FormData();body.set("input",JSON.stringify(parsed.data));for(const photo of optimized.current.files)body.append("photos",photo);
   const response=await fetch("/api/inquiries",{method:"POST",body});const result=await response.json();if(!response.ok)throw new Error(result.error??"문의 접수에 실패했습니다.");setReceipt(result.receiptNumber);
  }catch(error){setError(error instanceof Error?error.message:"문의 접수에 실패했습니다. 다시 시도해 주세요.");}finally{setBusy(false);}
 }
 if(receipt)return <section role="status" className="rounded-2xl border border-[var(--brand-200)] bg-white p-7"><h2 className="text-2xl font-black">문의가 접수되었습니다</h2><p className="mt-4">접수번호 <strong className="break-all">{receipt}</strong></p><p className="mt-3 text-sm leading-6 text-[var(--neutral-600)]">담당자가 내용을 확인하고 입력하신 전화번호로 연락드리겠습니다. 비회원 문의는 접수번호로 조회할 수 없습니다. 로그인 상태에서 접수한 문의는 내 계정에서 확인할 수 있습니다.</p><div className="mt-6 flex flex-wrap gap-4"><Link href="/account/inquiries" className="inline-flex min-h-11 items-center font-bold text-[var(--brand-700)] underline">내 문의 보기</Link><Link href="/" className="inline-flex min-h-11 items-center underline">홈으로</Link></div></section>;
 return <form onSubmit={submit} className="grid gap-5" aria-busy={busy}>
  {manual&&<label className="grid gap-2 text-sm font-bold">접수 경로<select name="source" className={fieldClass}><option value="phone">전화</option><option value="kakao">카카오톡</option></select></label>}
  <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">이름<input name="name" autoComplete="name" maxLength={80} required className={fieldClass}/></label><label className="grid gap-2 text-sm font-bold">전화번호<input name="phone" type="tel" autoComplete="tel" maxLength={24} placeholder="010-1234-5678" required className={fieldClass}/></label></div>
  <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">서비스<select name="service" aria-label="서비스" required className={fieldClass}><option value="">선택해 주세요</option>{Object.entries(SERVICE_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">지역<input name="region" autoComplete="address-level2" maxLength={160} placeholder="예: 서울 강남구" required className={fieldClass}/></label></div>
  <label className="grid gap-2 text-sm font-bold">문의 내용<textarea name="message" aria-label="문의 내용" maxLength={5000} rows={6} required placeholder="청소가 필요한 공간과 원하시는 작업을 알려 주세요." className={fieldClass}/><span className="text-xs font-normal text-[var(--neutral-500)]">최대 5,000자. 주민등록번호 등 민감한 정보는 입력하지 마세요.</span></label>
  {!manual&&<div className="grid gap-2"><label htmlFor="inquiry-photos" className="text-sm font-bold">현장 사진 (선택)</label><input id="inquiry-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className={`${fieldClass} text-sm`} onChange={event=>{const selected=Array.from(event.currentTarget.files??[]);const validation=validateAttachmentMetadata(selected);setError(validation??"");setPhotos(selected);request.current={key:"",input:""};}}/><p className="text-xs leading-5 text-[var(--neutral-600)]">JPEG, PNG, WebP 최대 5장 · 사진 한 장당 10MiB. 사진은 접수용으로 최적화되며 담당자만 볼 수 있습니다.</p>{photos.length>0&&<ul className="text-sm text-[var(--neutral-600)]">{photos.map((photo,index)=><li key={`${photo.name}-${index}`} className="break-all">{photo.name} ({(photo.size/1024/1024).toFixed(1)}MiB)</li>)}</ul>}</div>}
  <label key={policy?.inquiryConsent??"unavailable"} className="flex min-h-11 items-start gap-3 rounded-xl bg-[var(--neutral-50)] p-4 text-sm leading-6"><input type="checkbox" name="consent" required disabled={!consentReady} className="mt-1 size-5 accent-[var(--brand-600)]"/><span>{consentReady?<>{manual&&"고객에게 다음 동의를 확인했습니다: "}{policy?.inquiryConsent}</>:"개인정보 수집·이용 안내를 확인하는 중입니다."} <Link href="/privacy" target="_blank" className="font-bold underline">개인정보 처리방침</Link></span></label>
  {!consentReady&&<div role={content.error?"alert":"status"} className="rounded-xl border p-4 text-sm">{content.loading?"동의 안내를 불러오는 중입니다.":content.error?"동의 안내를 불러오지 못했습니다.":"개인정보 수집·이용 안내를 준비 중입니다. 게시가 완료되면 문의를 접수할 수 있습니다."}{content.error&&<button type="button" onClick={()=>void content.retry()} className="ml-3 min-h-11 underline">다시 불러오기</button>}</div>}
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  <button type="submit" disabled={busy||!consentReady} className="min-h-12 rounded-xl bg-[var(--brand-600)] px-6 font-bold text-white disabled:opacity-60">{busy?"접수 중…":manual?"문의 등록":"문의 접수"}</button>
 </form>;
}

import { describe, expect, it } from "vitest";
import { InquiryInputSchema, InquiryFilterSchema, validateAttachmentMetadata, customerStatus } from "@/features/inquiries/model/inquiry";
import { NotificationSettingsSchema } from "@/features/notifications/model/notification";
const valid = { name: "홍길동", phone: "010-1234-5678", service: "bathroom", region: "서울 강남구", message: "욕실 청소 문의드립니다.", consent: true, idempotencyKey: "e8d94516-e934-4a19-9e4f-9ae7dc8594e8" };
describe("inquiry validation", () => {
 it("normalizes telephone and strips client supplied ownership", () => { expect(InquiryInputSchema.parse({ ...valid, customerId:"attacker", assigneeId:"attacker" })).toEqual({ ...valid, phone:"01012345678" }); });
 it("requires explicit consent, bounded content and known service", () => { for(const value of [{consent:false},{message:"x".repeat(5001)},{service:"unknown"},{name:" "},{phone:"abc"}]) expect(InquiryInputSchema.safeParse({...valid,...value}).success).toBe(false); });
 it("enforces five files, image types and ten MiB each", () => { const photo = {type:"image/jpeg",size:10*1024*1024}; expect(validateAttachmentMetadata([photo])).toBeNull(); expect(validateAttachmentMetadata(Array(6).fill(photo))).toMatch(/5/); expect(validateAttachmentMetadata([{...photo,size:photo.size+1}])).toMatch(/10/); expect(validateAttachmentMetadata([{...photo,type:"image/svg+xml"}])).toMatch(/JPEG/); });
 it("keeps internal spam disposition private", () => { expect(customerStatus("spam")).toBe("접수 완료"); expect(customerStatus("consulting")).toBe("상담 중"); });
 it("defaults list pages and rejects unbounded or invalid filters", () => { expect(InquiryFilterSchema.parse({}).page).toBe(1); expect(InquiryFilterSchema.safeParse({page:-1}).success).toBe(false); expect(InquiryFilterSchema.safeParse({from:"bad"}).success).toBe(false); });
});
describe("disconnected notification provider", () => {
 it("cannot be enabled without a connected adapter", () => { expect(NotificationSettingsSchema.safeParse({enabled:true,provider:"none",recipients:[],events:["inquiry.created"],templateReference:""}).success).toBe(false); });
 it("rejects outbound customer addresses and accepts staff IDs", () => { expect(NotificationSettingsSchema.safeParse({enabled:false,provider:"none",recipients:["customer@example.com"],events:["inquiry.created"],templateReference:""}).success).toBe(false); });
});

it("accepts dashboard open and owner filters without widening unknown values",()=>{const id="e8d94516-e934-4a19-9e4f-9ae7dc8594e8";expect(InquiryFilterSchema.parse({status:"open",owner:id}).owner).toBe(id);expect(InquiryFilterSchema.safeParse({owner:"not-a-user"}).success).toBe(false);});

it("stores separate email, SMS and Kakao settings and refuses a single enabled channel",()=>{
 const settings=NotificationSettingsSchema.parse({enabled:false,provider:"none",recipients:[],events:[],templateReference:""});
 settings.externalChannels.email.templateReference="email-ops";settings.externalChannels.sms.templateReference="sms-ops";
 expect(settings.externalChannels.kakao.templateReference).toBe("");
 expect(NotificationSettingsSchema.safeParse({...settings,externalChannels:{...settings.externalChannels,kakao:{...settings.externalChannels.kakao,enabled:true}}}).success).toBe(false);
});

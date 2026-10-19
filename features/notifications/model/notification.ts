import { z } from "zod";
export const NOTIFICATION_EVENTS = ["inquiry.created","inquiry.assigned","operation.failed"] as const;
export const EXTERNAL_CHANNELS = ["email","sms","kakao"] as const;
export type ExternalChannel = typeof EXTERNAL_CHANNELS[number];
const disconnected = z.literal(false,{error:"연결된 발송 어댑터가 없어 외부 알림을 활성화할 수 없습니다."});
export const ExternalChannelSettingsSchema = z.object({enabled:disconnected,provider:z.literal("none"),recipients:z.array(z.uuid()).max(100),events:z.array(z.enum(NOTIFICATION_EVENTS)).max(3),templateReference:z.string().trim().max(200)});
export type ExternalChannelSettings = z.infer<typeof ExternalChannelSettingsSchema>;
const blankChannel = ():ExternalChannelSettings=>({enabled:false,provider:"none",recipients:[],events:[...NOTIFICATION_EVENTS],templateReference:""});
export const NotificationSettingsSchema = ExternalChannelSettingsSchema.extend({
 externalChannels:z.object({email:ExternalChannelSettingsSchema,sms:ExternalChannelSettingsSchema,kakao:ExternalChannelSettingsSchema}).default(()=>({email:blankChannel(),sms:blankChannel(),kakao:blankChannel()})),
});
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export interface OperatorNotification {id:string;event_type:typeof NOTIFICATION_EVENTS[number];title:string;target_path:string;read_at:string|null;created_at:string;}
export interface NotificationAttempt {id:string;outboxId:string;attemptedAt:string;status:"failed"|"sent";errorCode:string|null;}
export interface NotificationOutbox {id:string;channel:ExternalChannel;eventKey:string;recipientId:string;status:"blocked"|"pending"|"sent"|"failed";provider:string;createdAt:string;}
export interface ExternalNotificationAdapter {readonly channel:ExternalChannel;readonly provider:string;readonly connected:boolean;send(event:NotificationOutbox):Promise<{providerReference:string}>;}
export const EXTERNAL_PROVIDER_STATUS = "unconnected" as const;

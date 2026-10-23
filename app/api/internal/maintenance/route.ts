import { timingSafeEqual } from "node:crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { drainInquiryUploadCleanup } from "@/features/inquiries/server/cleanup";
export async function GET(request:Request) {
 const secret=process.env.CRON_SECRET;const header=request.headers.get("authorization")??"";
 const expected=`Bearer ${secret??""}`;
 if(!secret||Buffer.byteLength(header)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(header),Buffer.from(expected)))return new Response(null,{status:401});
 try {const client=createServiceSupabaseClient();const {data,error}=await client.rpc("prune_analytics_events");if(error)throw error;const uploads=await drainInquiryUploadCleanup(client);return Response.json({deleted:data,uploads});}catch{return Response.json({error:"maintenance_failed"},{status:503});}
}

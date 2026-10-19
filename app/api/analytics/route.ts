import { createHmac } from "node:crypto";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getServerAuthContext } from "@/features/auth/server/authorization";
import { ANALYTICS_CAMPAIGNS, normalizeAnalyticsPage } from "@/features/analytics/model/events";

const eventSchema=z.object({eventId:z.string().uuid(),visitorId:z.string().uuid(),sessionId:z.string().uuid(),consent:z.literal(true),path:z.string().max(240).refine(value=>normalizeAnalyticsPage(value)===value),referrer:z.string().max(200).regex(/^(direct|[a-z0-9.-]+)$/i),device:z.enum(["desktop","mobile","tablet"]),campaign:z.enum(ANALYTICS_CAMPAIGNS).nullable()}).strict();
export async function POST(request:Request) {
 if(request.headers.get("origin")!==new URL(request.url).origin)return new Response(null,{status:403});
 if(/bot|spider|crawler|headless/i.test(request.headers.get("user-agent")??""))return new Response(null,{status:204});
 if(Number(request.headers.get("content-length")??0)>2048)return new Response(null,{status:413});
 try {
  const text=await request.text();if(text.length>2048)return new Response(null,{status:413});
  let body:unknown;try{body=JSON.parse(text);}catch{return new Response(null,{status:400});}
  const parsed=eventSchema.safeParse(body);if(!parsed.success)return new Response(null,{status:400});
  const context=await getServerAuthContext();if(context?.role==="admin"||context?.role==="super_admin")return new Response(null,{status:204});
  const client=createServiceSupabaseClient();
  const address=request.headers.get("x-real-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]??"unknown";
  const rateKey=createHmac("sha256",process.env.SUPABASE_SECRET_KEY!).update(new Date().toISOString().slice(0,10)+":"+address).digest("hex");
  const {error}=await client.rpc("record_visit_event",{event:parsed.data,rate_key:rateKey});
  return new Response(null,{status:error?(error.message.includes("rate_limit")?429:503):204});
 }catch{return new Response(null,{status:503});}
}

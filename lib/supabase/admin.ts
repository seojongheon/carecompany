import "server-only";
import { createClient } from "@supabase/supabase-js";
export function createServiceSupabaseClient() {
 const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key) throw new Error("서버 연결 설정을 확인해 주세요.");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

import {NextResponse} from "next/server";
import {z} from "zod";
import {requireStaff} from "@/lib/admin/server";
import {createServiceSupabaseClient} from "@/lib/supabase/admin";
export async function GET(_request:Request,{params}:{params:Promise<{id:string;attachmentId:string}>}){
 try{const {id,attachmentId}=z.object({id:z.uuid(),attachmentId:z.uuid()}).parse(await params);const {client}=await requireStaff();const {data,error}=await client.from("inquiry_attachments").select("storage_path").eq("id",attachmentId).eq("inquiry_id",id).maybeSingle();if(error||!data)return new NextResponse("사진을 찾을 수 없습니다.",{status:404});
 const result=await createServiceSupabaseClient().storage.from("inquiry-attachments").download(data.storage_path);if(result.error||!result.data)return new NextResponse("사진을 불러오지 못했습니다.",{status:503});
 return new NextResponse(result.data,{headers:{"Content-Type":"image/webp","Cache-Control":"private, no-store","Content-Disposition":'inline; filename="inquiry-photo.webp"',"X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
 }catch{return new NextResponse("접근 권한이 없습니다.",{status:403});}
}

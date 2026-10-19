"use server";
import { requireStaff } from "@/lib/admin/server";
export interface MediaAsset { id:string; bucket:string; path:string; name:string; mime_type:string; size_bytes:number; owner_id:string|null; created_at:string; status:string; url?:string; usage?:{deletable:boolean; documents:Array<{key:string;draft:boolean;published:boolean}>;history:boolean}; }
export interface CleanupJob {id:string;asset_id:string;bucket:string;path:string;status:string;attempts:number;last_error:string|null;created_at:string}
const fail=(error:unknown)=>({ok:false as const,error:error instanceof Error?error.message:"미디어 작업에 실패했습니다."});
export async function listMedia(tab="site",query="",page=1) {
  try {
    const {client}=await requireStaff();
    if(tab==="cleanup") {const result=await client.from("media_cleanup_jobs").select("*",{count:"exact"}).order("created_at",{ascending:false}).range((page-1)*20,page*20-1);if(result.error)throw new Error(result.error.message);return {ok:true as const,assets:[] as MediaAsset[],jobs:result.data as CleanupJob[],total:result.count??0};}
    let request=client.from("media_assets").select("*",{count:"exact"}).neq("status","deleted").order("created_at",{ascending:false});
    if(tab==="site")request=request.in("bucket",["site-images","landing-hero"]);
    if(tab==="cases")request=request.in("bucket",["case-originals","case-reviewed-public"]);
    if(tab==="failed")request=request.in("status",["failed","uploading"]);
    if(query.trim())request=request.ilike("name",`%${query.trim().replace(/[%_]/g,"")}%`);
    const result=await request.range((Math.max(1,page)-1)*20,Math.max(1,page)*20-1);if(result.error)throw new Error(result.error.message);
    const assets=await Promise.all((result.data as MediaAsset[]).map(async(asset)=>{
      const [image,usage]=await Promise.all([asset.status==="ready"?client.storage.from(asset.bucket).createSignedUrl(asset.path,900):Promise.resolve({data:null,error:null}),client.rpc("media_asset_usage",{asset_id:asset.id})]);
      if(usage.error)throw new Error(usage.error.message);
      return {...asset,url:image.data?.signedUrl,usage:usage.data as MediaAsset["usage"]};
    }));
    return {ok:true as const,assets,jobs:[] as CleanupJob[],total:result.count??0};
  }catch(error){return fail(error);}
}
export async function registerUpload(path:string,name:string,size:number){try{const{client}=await requireStaff();const result=await client.rpc("register_media_asset",{asset_path:path,asset_name:name,asset_size:size});if(result.error)throw new Error(result.error.message);return{ok:true as const,id:String(result.data)};}catch(error){return fail(error);}}
export async function finishUpload(id:string,succeeded:boolean){try{const{client}=await requireStaff();const result=await client.rpc("finish_media_upload",{asset_id:id,succeeded});if(result.error)throw new Error(result.error.message);return{ok:true as const};}catch(error){return fail(error);}}
export async function cleanupAsset(id:string){try{const{client}=await requireStaff();const result=await client.rpc("request_media_cleanup",{asset_id:id});if(result.error)throw new Error(result.error.message.includes("asset_in_use")?"초안·공개본·이력에서 사용하는 이미지는 삭제할 수 없습니다.":result.error.message);return await retryCleanup(String(result.data));}catch(error){return fail(error);}}
export async function retryCleanup(id:string){try{const{client}=await requireStaff();const job=await client.from("media_cleanup_jobs").select("*").eq("id",id).single();if(job.error)throw new Error(job.error.message);if(job.data.status==="completed")return{ok:true as const};const result=await client.storage.from(job.data.bucket).remove([job.data.path]);const finish=await client.rpc("finish_media_cleanup",{job_id:id,succeeded:!result.error});if(finish.error)throw new Error(finish.error.message);if(result.error)throw new Error("파일 정리에 실패했습니다. 정리 작업 탭에서 다시 시도할 수 있습니다.");return{ok:true as const};}catch(error){return fail(error);}}

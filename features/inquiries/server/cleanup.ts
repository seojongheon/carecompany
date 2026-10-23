interface CleanupClient {
 rpc(name:string,args?:Record<string,unknown>):PromiseLike<{data?:unknown;error:unknown}>;
 storage:{from(bucket:string):{remove(paths:string[]):PromiseLike<{error:unknown}>}};
}
/** Objects are eligible only after a one-day grace period and a DB reference check. */
export async function drainInquiryUploadCleanup(client:CleanupClient):Promise<{removed:number;failed:number}>{
 try{
  const candidates=await client.rpc("inquiry_upload_cleanup_candidates");
  if(candidates.error)return {removed:0,failed:1};
  const paths=((candidates.data??[]) as {storage_path:string}[]).map(row=>row.storage_path);if(!paths.length)return {removed:0,failed:0};
  const result=await client.storage.from("inquiry-attachments").remove(paths);
  const ack=await client.rpc("finish_inquiry_upload_cleanup",{p_paths:paths,p_failed:!!result.error});
  return result.error||ack.error?{removed:0,failed:paths.length}:{removed:paths.length,failed:0};
 }catch{return {removed:0,failed:1};}
}

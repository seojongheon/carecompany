import {describe,expect,it,vi} from "vitest";
import {drainInquiryUploadCleanup} from "@/features/inquiries/server/cleanup";
describe("deferred private upload cleanup",()=>{
 it("only removes DB-confirmed expired unreferenced candidates",async()=>{const remove=vi.fn().mockResolvedValue({error:null});const rpc=vi.fn().mockResolvedValueOnce({data:[{storage_path:"old/unlinked.webp"}],error:null}).mockResolvedValue({error:null});await drainInquiryUploadCleanup({rpc,storage:{from:()=>({remove})}});expect(remove).toHaveBeenCalledWith(["old/unlinked.webp"]);expect(rpc).toHaveBeenLastCalledWith("finish_inquiry_upload_cleanup",{p_paths:["old/unlinked.webp"],p_failed:false});});
 it("does not delete any object when reference checks fail",async()=>{const remove=vi.fn();await drainInquiryUploadCleanup({rpc:vi.fn().mockResolvedValue({data:null,error:{message:"offline"}}),storage:{from:()=>({remove})}});expect(remove).not.toHaveBeenCalled();});
 it("keeps failed deletions in the durable retry queue",async()=>{const remove=vi.fn().mockResolvedValue({error:{message:"offline"}});const rpc=vi.fn().mockResolvedValueOnce({data:[{storage_path:"old/unlinked.webp"}],error:null}).mockResolvedValue({error:null});await drainInquiryUploadCleanup({rpc,storage:{from:()=>({remove})}});expect(rpc).toHaveBeenLastCalledWith("finish_inquiry_upload_cleanup",{p_paths:["old/unlinked.webp"],p_failed:true});});
});

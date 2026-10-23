import sharp from "sharp";
import {describe,expect,it} from "vitest";
import {sanitizeInquiryImage} from "@/features/inquiries/server/images";
describe("private inquiry image sanitation",()=>{
 it("rejects a file that only claims to be an image",async()=>{await expect(sanitizeInquiryImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),"image/png")).rejects.toThrow();});
 it("rejects mismatched encoding",async()=>{const bytes=await sharp({create:{width:2,height:2,channels:3,background:"red"}}).png().toBuffer();await expect(sanitizeInquiryImage(bytes,"image/jpeg")).rejects.toThrow();});
 it("decodes, rotates and strips embedded metadata into webp",async()=>{const bytes=await sharp({create:{width:4,height:2,channels:3,background:"red"}}).jpeg().withMetadata({orientation:6}).toBuffer();const result=await sanitizeInquiryImage(bytes,"image/jpeg");const metadata=await sharp(result).metadata();expect(metadata.format).toBe("webp");expect(metadata.width).toBe(2);expect(metadata.height).toBe(4);expect(metadata.exif).toBeUndefined();});
});

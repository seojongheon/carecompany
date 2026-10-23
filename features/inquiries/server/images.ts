import sharp from "sharp";
export async function sanitizeInquiryImage(bytes:Buffer,claimedType:string):Promise<Buffer>{
 const image=sharp(bytes,{limitInputPixels:40_000_000,failOn:"warning",animated:false});
 const metadata=await image.metadata();
 const expected:Record<string,string>={"image/jpeg":"jpeg","image/png":"png","image/webp":"webp"};
 if(!expected[claimedType]||metadata.format!==expected[claimedType]||(metadata.pages??1)>1)throw new Error("사진 형식이 올바르지 않습니다.");
 const output=await image.rotate().resize({width:3000,height:3000,fit:"inside",withoutEnlargement:true}).webp({quality:88}).toBuffer();
 if(output.byteLength>10*1024*1024)throw new Error("변환한 사진이 허용 크기를 초과했습니다.");
 return output;
}

import { validateAttachmentMetadata } from "./inquiry";
import { hasSupportedImageSignature } from "@/features/uploads/model/create-reviewed-webp";

const MAX_UPLOAD_BYTES = 600 * 1024;
const QUALITIES = [0.9, 0.8, 0.7, 0.6];

/** Keep originals in the form; only these bounded, metadata-free copies are uploaded. */
export async function optimizeInquiryPhotos(originals: readonly File[]): Promise<File[]> {
  const error = validateAttachmentMetadata(originals);
  if (error) throw new Error(error);
  const output: File[] = [];
  for (let index = 0; index < originals.length; index++) {
    const original = originals[index];
    if (!(await hasSupportedImageSignature(original))) throw new Error("파일 내용과 이미지 형식이 일치하지 않습니다. JPEG, PNG, WebP 사진을 다시 선택해 주세요.");
    if (typeof createImageBitmap !== "function") throw new Error("이 브라우저에서 사진을 변환할 수 없습니다. 최신 브라우저로 다시 시도해 주세요.");
    const bitmap = await createImageBitmap(original);
    const canvas = document.createElement("canvas");
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40_000_000) throw new Error("사진 해상도가 너무 큽니다. 4천만 화소 이하의 사진을 선택해 주세요.");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("사진을 변환할 수 없습니다. 다른 브라우저로 다시 시도해 주세요.");
      let scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
      let optimized: Blob | null = null;
      for (let attempt = 0; attempt < 8 && !optimized; attempt++) {
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        for (const quality of QUALITIES) {
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
          if (!blob || blob.type !== "image/webp") throw new Error("이 브라우저에서 WebP 사진을 변환할 수 없습니다. 최신 브라우저로 다시 시도해 주세요.");
          if (blob.size > 0 && blob.size <= MAX_UPLOAD_BYTES) { optimized = blob; break; }
        }
        scale *= 0.75;
      }
      if (!optimized) throw new Error("사진 용량을 줄일 수 없습니다. 다른 사진을 선택해 주세요.");
      output.push(new File([optimized], `inquiry-${index + 1}.webp`, { type: "image/webp", lastModified: original.lastModified }));
    } finally {
      bitmap.close();
      canvas.width = 0; canvas.height = 0;
    }
  }
  return output;
}

import type { SupabaseClient } from "@supabase/supabase-js";

import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/features/uploads/model/upload-constraints";

export type UploadedCaseFile = {
  originalPath: string;
  reviewedPath: string;
  mimeType: "image/webp";
  sizeBytes: number;
};

type UploadResult = { ok: true; files: UploadedCaseFile[] } | { ok: false; code: "storage_disabled" | "selection_limit" | "invalid_file" | "processing_failed" | "upload_failed" };

async function createReviewedWebp(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") throw new Error("이미지 변환을 지원하지 않는 브라우저입니다.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 변환 캔버스를 만들 수 없습니다.");
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) throw new Error("이미지 검토본을 생성할 수 없습니다.");
    const baseName = file.name.replace(/\.[^.]+$/, "") || "case-image";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

export function createStorageGateway({ enabled, client, createReviewedFile = createReviewedWebp }: { enabled: boolean; client: SupabaseClient; createReviewedFile?: (file: File) => Promise<File> }) {
  return {
    async uploadCaseFiles(caseId: string, files: File[]): Promise<UploadResult> {
      if (!enabled) return { ok: false, code: "storage_disabled" };
      if (files.length > 20) return { ok: false, code: "selection_limit" };
      if (files.some((file) => file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]))) {
        return { ok: false, code: "invalid_file" };
      }

      const uploaded: UploadedCaseFile[] = [];
      for (const file of files) {
        let reviewed: File;
        try {
          reviewed = await createReviewedFile(file);
        } catch {
          return { ok: false, code: "processing_failed" };
        }
        const sourceName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const reviewName = reviewed.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const objectId = crypto.randomUUID();
        const originalPath = `${caseId}/${objectId}-${sourceName}`;
        const reviewedPath = `${caseId}/${objectId}-${reviewName}`;
        const originals = client.storage.from("case-originals");
        const originalUpload = await originals.upload(originalPath, file, { upsert: false, contentType: file.type });
        if (originalUpload.error) return { ok: false, code: "upload_failed" };
        const reviewUpload = await client.storage.from("case-reviewed-public").upload(reviewedPath, reviewed, { upsert: false, contentType: "image/webp" });
        if (reviewUpload.error) {
          await originals.remove([originalPath]);
          return { ok: false, code: "upload_failed" };
        }
        uploaded.push({ originalPath, reviewedPath, mimeType: "image/webp", sizeBytes: reviewed.size });
      }
      return { ok: true, files: uploaded };
    },
  };
}

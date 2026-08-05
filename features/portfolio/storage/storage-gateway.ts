import type { SupabaseClient } from "@supabase/supabase-js";

import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/features/uploads/model/upload-constraints";
import { createReviewedWebp } from "@/features/uploads/model/create-reviewed-webp";

export type UploadedCaseFile = {
  originalPath: string;
  reviewedPath: string;
  mimeType: "image/webp";
  sizeBytes: number;
};

type UploadResult =
  | { ok: true; files: UploadedCaseFile[] }
  | { ok: false; code: "storage_disabled" | "selection_limit" | "invalid_file" | "processing_failed" | "upload_failed" }
  | { ok: false; code: "cleanup_required"; files: StoredCaseFile[] };

type StoredCaseFile = Pick<UploadedCaseFile, "originalPath" | "reviewedPath">;
type RemoveResult = { ok: true } | { ok: false; code: "storage_disabled" | "remove_failed" };

export function createStorageGateway({ enabled, client, createReviewedFile = createReviewedWebp }: { enabled: boolean; client: SupabaseClient; createReviewedFile?: (file: File) => Promise<File> }) {
  const removeCaseFiles = async (files: StoredCaseFile[]): Promise<RemoveResult> => {
    if (!enabled) return { ok: false, code: "storage_disabled" };
    const originals = files.map(({ originalPath }) => originalPath).filter(Boolean);
    const reviewed = files.map(({ reviewedPath }) => reviewedPath).filter(Boolean);
    const [originalResult, reviewedResult] = await Promise.all([
      originals.length ? client.storage.from("case-originals").remove(originals) : Promise.resolve({ error: null }),
      reviewed.length ? client.storage.from("case-reviewed-public").remove(reviewed) : Promise.resolve({ error: null }),
    ]);
    return originalResult.error || reviewedResult.error ? { ok: false, code: "remove_failed" } : { ok: true };
  };

  return {
    async uploadCaseFiles(caseId: string, files: File[]): Promise<UploadResult> {
      if (!enabled) return { ok: false, code: "storage_disabled" };
      if (files.length > 20) return { ok: false, code: "selection_limit" };
      if (files.some((file) => !file.size || file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]))) {
        return { ok: false, code: "invalid_file" };
      }

      const uploaded: UploadedCaseFile[] = [];
      for (const file of files) {
        let reviewed: File;
        try {
          reviewed = await createReviewedFile(file);
        } catch {
          if (uploaded.length && !(await removeCaseFiles(uploaded)).ok) {
            return { ok: false, code: "cleanup_required", files: uploaded };
          }
          return { ok: false, code: "processing_failed" };
        }
        const sourceName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const reviewName = reviewed.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const objectId = crypto.randomUUID();
        const originalPath = `${caseId}/${objectId}-${sourceName}`;
        const reviewedPath = `${caseId}/${objectId}-${reviewName}`;
        const originals = client.storage.from("case-originals");
        const originalUpload = await originals.upload(originalPath, file, { upsert: false, contentType: file.type });
        if (originalUpload.error) {
          if (uploaded.length && !(await removeCaseFiles(uploaded)).ok) {
            return { ok: false, code: "cleanup_required", files: uploaded };
          }
          return { ok: false, code: "upload_failed" };
        }
        const reviewUpload = await client.storage.from("case-reviewed-public").upload(reviewedPath, reviewed, { upsert: false, contentType: "image/webp" });
        if (reviewUpload.error) {
          const cleanupFiles = [...uploaded, { originalPath, reviewedPath: "" }];
          if (!(await removeCaseFiles(cleanupFiles)).ok) {
            return { ok: false, code: "cleanup_required", files: cleanupFiles };
          }
          return { ok: false, code: "upload_failed" };
        }
        uploaded.push({ originalPath, reviewedPath, mimeType: "image/webp", sizeBytes: reviewed.size });
      }
      return { ok: true, files: uploaded };
    },
    removeCaseFiles,
  };
}

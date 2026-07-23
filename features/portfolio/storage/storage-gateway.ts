import type { SupabaseClient } from "@supabase/supabase-js";

import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/features/uploads/model/upload-constraints";

type UploadResult = { ok: true; paths: string[] } | { ok: false; code: "storage_disabled" | "selection_limit" | "invalid_file" | "upload_failed" };

export function createStorageGateway({ enabled, client }: { enabled: boolean; client: SupabaseClient }) {
  return {
    async uploadCaseFiles(caseId: string, files: File[]): Promise<UploadResult> {
      if (!enabled) return { ok: false, code: "storage_disabled" };
      if (files.length > 20) return { ok: false, code: "selection_limit" };
      if (files.some((file) => file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]))) {
        return { ok: false, code: "invalid_file" };
      }

      const paths: string[] = [];
      for (const file of files) {
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const path = `${caseId}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await client.storage.from("case-originals").upload(path, file, { upsert: false, contentType: file.type });
        if (error) return { ok: false, code: "upload_failed" };
        paths.push(path);
      }
      return { ok: true, paths };
    },
  };
}

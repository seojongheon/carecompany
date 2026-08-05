import type { SupabaseClient } from "@supabase/supabase-js";

import { createReviewedWebp } from "@/features/uploads/model/create-reviewed-webp";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/features/uploads/model/upload-constraints";

type HeroUploadResult =
  | { ok: true; path: string; sizeBytes: number; mimeType: "image/webp" }
  | { ok: false; code: "storage_disabled" | "invalid_file" | "processing_failed" | "upload_failed" };

type HeroRemoveResult =
  | { ok: true; removed: boolean }
  | { ok: false; code: "storage_disabled" | "reference_check_failed" | "remove_failed" | "finalize_failed" };

type HeroRetryResult = { ok: true; retried: number } | { ok: false; code: "storage_disabled" | "queue_read_failed" | "remove_failed" | "finalize_failed" };

export function createHeroStorageGateway({
  enabled,
  client,
  createReviewedFile = createReviewedWebp,
}: {
  enabled: boolean;
  client: SupabaseClient;
  createReviewedFile?: (file: File) => Promise<File>;
}) {
  return {
    async uploadHeroImage(file: File): Promise<HeroUploadResult> {
      if (!enabled) return { ok: false, code: "storage_disabled" };
      if (!file.size || file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        return { ok: false, code: "invalid_file" };
      }

      let reviewed: File;
      try {
        reviewed = await createReviewedFile(file);
      } catch {
        return { ok: false, code: "processing_failed" };
      }

      const path = `hero/${crypto.randomUUID()}.webp`;
      const result = await client.storage.from("landing-hero").upload(path, reviewed, {
        upsert: false,
        contentType: "image/webp",
      });
      return result.error
        ? { ok: false, code: "upload_failed" }
        : { ok: true, path, sizeBytes: reviewed.size, mimeType: "image/webp" };
    },

    async removeIfUnreferenced(path: string): Promise<HeroRemoveResult> {
      if (!enabled) return { ok: false, code: "storage_disabled" };
      const claimResult = await client.rpc("claim_landing_hero_cleanup", { storage_path: path });
      if (claimResult.error) return { ok: false, code: "reference_check_failed" };
      if (claimResult.data !== true) return { ok: true, removed: false };
      const removeResult = await client.storage.from("landing-hero").remove([path]);
      if (removeResult.error) return { ok: false, code: "remove_failed" };
      const finishResult = await client.rpc("finish_landing_hero_cleanup", { storage_path: path });
      return finishResult.error ? { ok: false, code: "finalize_failed" } : { ok: true, removed: true };
    },

    async retryPendingCleanup(): Promise<HeroRetryResult> {
      if (!enabled) return { ok: false, code: "storage_disabled" };
      const queueResult = await client.rpc("list_pending_landing_hero_cleanup");
      if (queueResult.error || !Array.isArray(queueResult.data)) return { ok: false, code: "queue_read_failed" };
      let retried = 0;
      for (const path of queueResult.data as string[]) {
        const removeResult = await client.storage.from("landing-hero").remove([path]);
        if (removeResult.error) return { ok: false, code: "remove_failed" };
        const finishResult = await client.rpc("finish_landing_hero_cleanup", { storage_path: path });
        if (finishResult.error) return { ok: false, code: "finalize_failed" };
        retried += 1;
      }
      return { ok: true, retried };
    },
  };
}

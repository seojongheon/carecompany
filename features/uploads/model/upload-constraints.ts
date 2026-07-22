import { MAX_FILES_PER_SELECTION, MAX_MEDIA_PER_CASE } from "@/features/portfolio/model/schemas";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type UploadIssueCode = "selection-limit" | "case-limit" | "unsupported-type" | "file-too-large";

export interface UploadIssue {
  code: UploadIssueCode;
  fileName?: string;
  message: string;
}

export function validateFileSelection(files: File[], existingCount: number) {
  if (files.length > MAX_FILES_PER_SELECTION) {
    return {
      accepted: [] as File[],
      issues: [{ code: "selection-limit", message: `한 번에 최대 ${MAX_FILES_PER_SELECTION}장까지 선택할 수 있습니다.` }] satisfies UploadIssue[],
    };
  }
  if (existingCount + files.length > MAX_MEDIA_PER_CASE) {
    return {
      accepted: [] as File[],
      issues: [{ code: "case-limit", message: `사례당 최대 ${MAX_MEDIA_PER_CASE}장입니다. 기존 사진을 삭제한 뒤 다시 선택해 주세요.` }] satisfies UploadIssue[],
    };
  }

  const issues: UploadIssue[] = [];
  const accepted = files.filter((selected) => {
    if (!ALLOWED_IMAGE_TYPES.includes(selected.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      issues.push({ code: "unsupported-type", fileName: selected.name, message: `${selected.name}: 지원하지 않는 이미지 형식입니다.` });
      return false;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      issues.push({ code: "file-too-large", fileName: selected.name, message: `${selected.name}: 파일 크기는 20MB 이하여야 합니다.` });
      return false;
    }
    return true;
  });
  return { accepted, issues };
}


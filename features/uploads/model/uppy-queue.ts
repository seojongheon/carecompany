import Uppy from "@uppy/core";

import { MAX_FILES_PER_SELECTION, MAX_MEDIA_PER_CASE } from "@/features/portfolio/model/schemas";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "./upload-constraints";

export function createUppyQueue(existingCount: number) {
  const available = Math.max(0, MAX_MEDIA_PER_CASE - existingCount);
  return new Uppy({
    autoProceed: false,
    restrictions: {
      allowedFileTypes: [...ALLOWED_IMAGE_TYPES],
      maxFileSize: MAX_FILE_SIZE_BYTES,
      maxNumberOfFiles: Math.min(MAX_FILES_PER_SELECTION, available),
    },
  });
}


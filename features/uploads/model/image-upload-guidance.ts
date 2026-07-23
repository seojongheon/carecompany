import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "./upload-constraints";

export interface ImageUploadGuidance {
  id: "case-image" | "landing-hero-image";
  label: string;
  inputLabel: string;
  recommendation: string;
  description: string;
  maxFiles: number;
}

const allowedFormats = ALLOWED_IMAGE_TYPES.includes("image/webp") ? "JPG 또는 WebP" : "JPG";

export const CASE_IMAGE_GUIDANCE: ImageUploadGuidance = {
  id: "case-image",
  label: "사례 사진",
  inputLabel: "사례 사진 파일 선택",
  recommendation: "권장 1600 × 1200px · 4:3 · JPG 또는 WebP",
  description: `회당 최대 20장 · 파일당 최대 ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB · ${allowedFormats} 권장`,
  maxFiles: 20,
};

export const LANDING_HERO_IMAGE_GUIDANCE: ImageUploadGuidance = {
  id: "landing-hero-image",
  label: "랜딩 대표이미지",
  inputLabel: "랜딩 대표이미지 파일 선택",
  recommendation: "권장 1920 × 1080px · 16:9 · JPG 또는 WebP",
  description: `한 장만 선택 · 파일당 최대 ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB · ${allowedFormats} 권장`,
  maxFiles: 1,
};

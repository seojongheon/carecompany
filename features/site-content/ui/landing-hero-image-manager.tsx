/* eslint-disable @next/next/no-img-element -- Browser object URLs cannot be optimized by next/image. */

"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import type { HomeContent } from "../model/types";
import { LANDING_HERO_IMAGE_GUIDANCE } from "@/features/uploads/model/image-upload-guidance";
import { validateFileSelection } from "@/features/uploads/model/upload-constraints";
import { ImageDropzone } from "@/features/uploads/ui/image-dropzone";

export function LandingHeroImageManager({ home, onChange }: { home: HomeContent; onChange(next: HomeContent): void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const select = (files: File[]) => {
    const [file] = files;
    if (!file) return;
    const result = validateFileSelection([file], 0);
    if (result.issues.length) {
      setNotice(result.issues.map(({ message }) => message).join(" "));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null);
    setNotice(files.length > 1 ? "랜딩 대표이미지는 첫 번째 파일만 미리 봅니다. Storage 활성화 후 실제 저장됩니다." : "Storage 활성화 후 실제 저장됩니다. 지금은 브라우저 미리보기만 표시합니다.");
  };

  return <section className="md:col-span-2"><ImageDropzone guidance={LANDING_HERO_IMAGE_GUIDANCE} onFiles={select} />{previewUrl ? <img className="mt-4 aspect-video w-full rounded-xl object-cover" src={previewUrl} alt="선택한 랜딩 대표이미지 미리보기" /> : null}<label className="mt-5 block"><span className="mb-2 block text-sm font-bold">대표 이미지 대체 텍스트</span><Input aria-label="대표 이미지 대체 텍스트" value={home.heroImageAlt} onChange={(event) => onChange({ ...home, heroImageAlt: event.target.value })} /></label>{notice ? <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{notice}</p> : null}</section>;
}

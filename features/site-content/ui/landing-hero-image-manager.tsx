/* eslint-disable @next/next/no-img-element -- Browser object URLs cannot be optimized by next/image. */

"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import type { HomeContent } from "../model/types";
import { LANDING_HERO_IMAGE_GUIDANCE } from "@/features/uploads/model/image-upload-guidance";
import { validateFileSelection } from "@/features/uploads/model/upload-constraints";
import { ImageDropzone } from "@/features/uploads/ui/image-dropzone";
import { isSupabaseStorageAllowed } from "@/features/uploads/model/upload-runtime";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createHeroStorageGateway } from "../storage/hero-storage-gateway";

export function LandingHeroImageManager({ home, onChange }: { home: HomeContent; onChange(next: HomeContent): void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pendingPath = useRef<string | null>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => {
    if (
      pendingPath.current
      && isSupabaseStorageAllowed(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true", process.env.NODE_ENV)
    ) {
      void createHeroStorageGateway({ enabled: true, client: createBrowserSupabaseClient() })
        .removeIfUnreferenced(pendingPath.current);
    }
  }, []);
  useEffect(() => {
    if (!isSupabaseStorageAllowed(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true", process.env.NODE_ENV)) return;
    void createHeroStorageGateway({ enabled: true, client: createBrowserSupabaseClient() })
      .retryPendingCleanup()
      .then((result) => {
        if (!result.ok) setNotice("이전에 남은 대표 이미지 파일 정리를 완료하지 못했습니다. 다시 접속해 재시도해 주세요.");
      });
  }, []);

  const select = async (files: File[]) => {
    const [file] = files;
    if (!file) return;
    const result = validateFileSelection([file], 0);
    if (result.issues.length) {
      setNotice(result.issues.map(({ message }) => message).join(" "));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null);
    const storageEnabled = isSupabaseStorageAllowed(
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === "true",
      process.env.NODE_ENV,
    );
    if (!storageEnabled) {
      setNotice(files.length > 1 ? "랜딩 대표이미지는 첫 번째 파일만 미리 봅니다. Storage 활성화 후 실제 저장됩니다." : "Storage 활성화 후 실제 저장됩니다. 지금은 브라우저 미리보기만 표시합니다.");
      return;
    }

    setNotice("대표 이미지를 Storage에 저장하고 있습니다.");
    const gateway = createHeroStorageGateway({
      enabled: true,
      client: createBrowserSupabaseClient(),
    });
    const uploadResult = await gateway.uploadHeroImage(file);
    if (!uploadResult.ok) {
      setNotice(uploadResult.code === "processing_failed"
        ? "대표 이미지를 WebP로 변환하지 못했습니다. JPG, PNG 또는 WebP 파일을 사용해 주세요."
        : "대표 이미지를 Storage에 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    const supersededPath = pendingPath.current;
    pendingPath.current = uploadResult.path;
    onChange({ ...home, heroImageStoragePath: uploadResult.path, heroImageUrl: undefined });
    if (supersededPath && supersededPath !== uploadResult.path) {
      const cleanup = await gateway.removeIfUnreferenced(supersededPath);
      setNotice(cleanup.ok
        ? "대표 이미지를 Storage에 저장했습니다. 이전 임시 파일도 정리했습니다."
        : "대표 이미지는 저장했지만 이전 임시 파일 정리가 필요합니다.");
      return;
    }
    setNotice("대표 이미지를 Storage에 저장했습니다.");
  };

  return <section className="md:col-span-2"><ImageDropzone guidance={LANDING_HERO_IMAGE_GUIDANCE} onFiles={select} />{previewUrl ? <img className="mt-4 aspect-video w-full rounded-xl object-cover" src={previewUrl} alt="선택한 랜딩 대표이미지 미리보기" /> : null}<label className="mt-5 block"><span className="mb-2 block text-sm font-bold">대표 이미지 대체 텍스트</span><Input aria-label="대표 이미지 대체 텍스트" value={home.heroImageAlt} onChange={(event) => onChange({ ...home, heroImageAlt: event.target.value })} /></label>{notice ? <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{notice}</p> : null}</section>;
}

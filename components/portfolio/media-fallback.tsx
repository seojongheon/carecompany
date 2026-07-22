"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";

export function MediaFallback({ src, alt, sizes, className, eager = false }: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span role="img" aria-label={`${alt} — 이미지를 불러오지 못했습니다`} className="absolute inset-0 grid place-items-center bg-[var(--neutral-100)] p-4 text-center text-sm font-semibold text-[var(--neutral-500)]"><span><ImageOff aria-hidden="true" className="mx-auto mb-2" />이미지를 불러오지 못했습니다</span></span>;
  }
  return <Image src={src} alt={alt} fill loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} className={className} sizes={sizes} />;
}

"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ALLOWED_IMAGE_TYPES } from "../model/upload-constraints";
import type { ImageUploadGuidance } from "../model/image-upload-guidance";

type ImageDropzoneProps = {
  guidance: ImageUploadGuidance;
  multiple?: boolean;
  disabled?: boolean;
  onFiles(files: File[]): void;
};

export function ImageDropzone({ guidance, multiple = false, disabled = false, onFiles }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const submit = (files: FileList | File[]) => onFiles(Array.from(files));

  return <section
    data-testid={`${guidance.id}-dropzone`}
    className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${dragging ? "border-[var(--brand-600)] bg-[var(--brand-50)]" : "border-[var(--neutral-200)] bg-[var(--neutral-50)]"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
    onDragOver={(event) => event.preventDefault()}
    onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
    onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) submit(event.dataTransfer.files); }}
  >
    <ImagePlus className="mx-auto text-[var(--brand-700)]" aria-hidden="true" size={28} />
    <h3 className="mt-3 font-bold">{guidance.label}을 여기로 끌어 놓으세요</h3>
    <p className="mt-2 text-sm font-semibold text-[var(--neutral-700)]">{guidance.recommendation}</p>
    <p className="mt-1 text-sm text-[var(--neutral-500)]">{guidance.description}</p>
    <input
      ref={inputRef}
      className="sr-only"
      aria-label={guidance.inputLabel}
      type="file"
      accept={ALLOWED_IMAGE_TYPES.join(",")}
      multiple={multiple}
      disabled={disabled}
      onChange={(event) => { submit(event.target.files ?? []); event.target.value = ""; }}
    />
    <Button className="mt-4" type="button" variant="secondary" disabled={disabled} onClick={() => inputRef.current?.click()}>
      <ImagePlus aria-hidden="true" size={18} />파일 고르기
    </Button>
    <p className="mt-3 text-xs text-[var(--neutral-500)]">권장 비율과 다르면 공개 화면에서 일부가 잘릴 수 있습니다.</p>
  </section>;
}

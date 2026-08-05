export async function hasSupportedImageSignature(file: File): Promise<boolean> {
  const header = file.slice(0, 12);
  const buffer = typeof header.arrayBuffer === "function"
    ? await header.arrayBuffer()
    : await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("이미지 헤더를 읽지 못했습니다."));
      reader.readAsArrayBuffer(header);
    });
  const bytes = new Uint8Array(buffer);
  if (file.type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (file.type === "image/webp") {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function createReviewedWebp(file: File): Promise<File> {
  if (!(await hasSupportedImageSignature(file))) {
    throw new Error("파일 내용과 이미지 형식이 일치하지 않습니다.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("이미지 변환을 지원하지 않는 브라우저입니다.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 변환 캔버스를 만들 수 없습니다.");
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) throw new Error("이미지 검토본을 생성할 수 없습니다.");
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

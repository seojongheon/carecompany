import { afterEach, describe, expect, it, vi } from "vitest";
import { optimizeInquiryPhotos } from "@/features/inquiries/model/optimize-photos";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("bounded inquiry upload photos", () => {
  it("rejects mislabeled originals before producing an accepted WebP copy", async () => {
    vi.stubGlobal("createImageBitmap", async () => ({ width: 100, height: 100, close: vi.fn() }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["webp"], { type: "image/webp" })));
    await expect(optimizeInquiryPhotos([new File(["GIF89a"], "photo.jpg", { type: "image/jpeg" })])).rejects.toThrow(/파일 내용/);
  });
  it("reduces large originals until five WebP copies fit the request budget", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", async () => ({ width: 4000, height: 3000, close }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback, type, quality) {
      callback(new Blob([new Uint8Array(Math.ceil(this.width * this.height * Number(quality)))], { type }));
    });
    const bytes = new Uint8Array(10 * 1024 * 1024); bytes.set([0xff, 0xd8, 0xff]);
    const originals = Array.from({ length: 5 }, (_, index) => new File([bytes], `original-${index}.jpg`, { type: "image/jpeg" }));
    const copies = await optimizeInquiryPhotos(originals);
    expect(copies).toHaveLength(5);
    expect(copies.every(file => file.type === "image/webp" && file.size > 0 && file.size <= 600 * 1024)).toBe(true);
    expect(copies.reduce((total, file) => total + file.size, 0)).toBeLessThan(3.5 * 1024 * 1024);
    expect(originals.every(file => file.size === 10 * 1024 * 1024)).toBe(true);
    expect(close).toHaveBeenCalledTimes(5);
  });
  it("rejects browser fallback encodings instead of uploading mislabeled WebP", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", async () => ({ width: 100, height: 100, close }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["png"], { type: "image/png" })));
    await expect(optimizeInquiryPhotos([new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" })])).rejects.toThrow(/WebP/);
    expect(close).toHaveBeenCalledOnce();
  });
});

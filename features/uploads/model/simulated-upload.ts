export interface SimulatedUploadOptions {
  id: string;
  shouldFail: boolean;
  onProgress(progress: number): void;
  intervalMs?: number;
}

export interface SimulatedUploadResult {
  id: string;
  status: "ready" | "failed";
  progress: number;
  error: string | null;
}

export function runSimulatedUpload({
  id,
  shouldFail,
  onProgress,
  intervalMs = 90,
}: SimulatedUploadOptions): Promise<SimulatedUploadResult> {
  return new Promise((resolve) => {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 20);
      onProgress(progress);
      if (shouldFail && progress === 60) {
        window.clearInterval(timer);
        resolve({ id, status: "failed", progress, error: "목업 업로드에 실패했습니다. 다시 시도해 주세요." });
      } else if (progress === 100) {
        window.clearInterval(timer);
        resolve({ id, status: "ready", progress, error: null });
      }
    }, intervalMs);
  });
}


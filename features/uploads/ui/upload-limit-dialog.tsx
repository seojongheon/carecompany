import { Button } from "@/components/ui/button";

export function UploadLimitDialog({ message, onClose }: { message: string; onClose(): void }) {
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[var(--overlay)] p-4"><div role="alertdialog" aria-modal="true" aria-labelledby="upload-limit-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="upload-limit-title" className="text-xl font-black">사진을 추가할 수 없습니다</h2><p className="mt-3 text-[var(--neutral-600)]">{message}</p><div className="mt-6 text-right"><Button onClick={onClose}>확인</Button></div></div></div>;
}


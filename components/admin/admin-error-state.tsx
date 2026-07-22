import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"><TriangleAlert aria-hidden="true" /><h2 className="mt-2 font-black">작업을 저장하지 못했습니다</h2><p className="mt-1 text-sm">{message}</p>{onRetry ? <Button className="mt-4" variant="secondary" onClick={onRetry}>다시 시도</Button> : null}</div>;
}

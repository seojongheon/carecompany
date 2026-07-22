import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UnpublishDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange(open: boolean): void; onConfirm(): void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogTitle>비공개로 전환할까요?</DialogTitle><DialogDescription className="mt-2 text-[var(--neutral-600)]">고객 목록, 상세 주소와 관련 사례에서 즉시 사라집니다. 관리자 데이터는 유지됩니다.</DialogDescription><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => onOpenChange(false)}>취소</Button><Button variant="danger" onClick={() => { onConfirm(); onOpenChange(false); }}>비공개 전환 확인</Button></div></DialogContent></Dialog>;
}


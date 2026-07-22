import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteCaseDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange(open: boolean): void; onConfirm(): void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogTitle>사례를 삭제 상태로 바꿀까요?</DialogTitle><DialogDescription className="mt-2">고객 화면에서는 즉시 사라지며 이 목업에서는 복원 기능을 제공하지 않습니다.</DialogDescription><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => onOpenChange(false)}>취소</Button><Button variant="danger" onClick={() => { onConfirm(); onOpenChange(false); }}>삭제 확인</Button></div></DialogContent></Dialog>;
}


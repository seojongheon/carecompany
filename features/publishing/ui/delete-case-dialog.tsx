import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteCaseDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange(open: boolean): void; onConfirm(): void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogTitle>사례를 휴지통으로 이동할까요?</DialogTitle><DialogDescription className="mt-2">고객 화면에서 즉시 사라집니다. 파일과 이력은 보관하며 휴지통에서 비공개로 복원할 수 있습니다.</DialogDescription><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => onOpenChange(false)}>취소</Button><Button variant="danger" onClick={() => { onConfirm(); onOpenChange(false); }}>삭제 확인</Button></div></DialogContent></Dialog>;
}


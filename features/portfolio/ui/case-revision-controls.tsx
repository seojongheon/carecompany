"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminPortfolio } from "../repository/use-portfolio";

export function CaseRevisionControls({ caseId }: { caseId: string }) {
 const { snapshot, discardDraft, restoreHistory, restoreDeleted, mutation } = useAdminPortfolio();
 const item = snapshot.cases.find(c => c.id === caseId);
 const [confirm, setConfirm] = useState<"discard" | "restore" | string | null>(null);
 const [notice, setNotice] = useState("");
 const [preview, setPreview] = useState<string | null>(null);
 if (!item) return null;
 const history = snapshot.history?.[caseId] ?? [];
 const execute = async () => {
  const ok = confirm === "discard" ? await discardDraft(caseId) : confirm === "restore" ? await restoreDeleted(caseId) : confirm ? await restoreHistory(caseId, confirm) : false;
  if (ok) { setConfirm(null); setNotice(confirm === "discard" ? "편집 초안을 폐기했습니다." : "비공개 상태로 복원했습니다. 검토 후 공개해 주세요."); window.location.reload(); }
 };
 return <section className="rounded-2xl border border-slate-200 bg-white p-5">
  <h2 className="text-xl font-black">공개본과 수정 이력</h2><p className="mt-2 text-sm text-slate-600">{item.status === "published" ? "고객 화면에는 마지막 공개본이 표시됩니다. 편집 내용은 재공개할 때 반영됩니다." : item.status === "deleted" ? "휴지통의 사례는 고객에게 보이지 않습니다. 복원하면 비공개로 돌아갑니다." : "현재 고객에게 공개되지 않은 사례입니다."}</p>
  <p className="mt-2 text-sm">버전 {item.revision ?? 0}{item.hasDraft ? " · 편집 초안 있음" : " · 저장된 변경 없음"}</p>
  <div className="mt-3 flex flex-wrap gap-2">{item.hasDraft && item.status !== "deleted" ? <Button variant="secondary" onClick={() => setConfirm("discard")}>편집 초안 폐기</Button> : null}{item.status === "deleted" ? <Button onClick={() => setConfirm("restore")}>휴지통에서 복원</Button> : null}</div>
  {confirm ? <div role="alertdialog" aria-label="사례 변경 확인" className="mt-4 rounded-xl bg-amber-50 p-4"><p>{confirm === "discard" ? "저장된 편집 초안을 폐기합니다. 현재 공개본은 유지됩니다." : confirm === "restore" ? "사례를 비공개 상태로 복원합니다." : "선택한 이력으로 현재 초안을 교체합니다. 고객 공개본은 유지됩니다."}</p><div className="mt-3 flex gap-2"><Button onClick={execute} disabled={mutation.state === "saving"}>확인</Button><Button variant="secondary" onClick={() => setConfirm(null)}>취소</Button></div></div> : null}
  <details className="mt-5"><summary className="min-h-11 cursor-pointer font-bold">공개 이력 {history.length}개</summary><ul className="grid gap-3">{history.map(version => <li key={version.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span>버전 {version.revision} · {new Date(version.createdAt).toLocaleString("ko-KR")}</span><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setPreview(preview === version.id ? null : version.id)}>내용 보기</Button><Button variant="secondary" size="sm" disabled={item.status === "deleted"} onClick={() => setConfirm(version.id)}>초안으로 복원</Button></div></div>{preview === version.id ? <div className="mt-3 whitespace-pre-wrap text-sm"><h3 className="font-bold">{version.manifest.case.title}</h3><p>{version.manifest.case.locationDisplay}</p><p>{version.manifest.case.summary}</p><p>{version.manifest.case.problemDescription}</p><p>{version.manifest.case.workDescription}</p><p>{version.manifest.case.resultDescription}</p><p>사진 {version.manifest.media.length}장 · 영상 {version.manifest.videos.length}개 · 태그 {version.manifest.tagIds.length}개</p></div> : null}</li>)}</ul></details>
  {notice ? <p role="status" className="mt-3">{notice}</p> : null}{mutation.state === "failed" ? <p role="alert" className="mt-3 text-red-700">{mutation.message}</p> : null}
 </section>;
}

"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";
import type { PublishChecklist as Checklist } from "@/features/portfolio/model/types";
import { getPublishChecks } from "../model/publish-validator";
import { UnpublishDialog } from "./unpublish-dialog";
import { DeleteCaseDialog } from "./delete-case-dialog";

const privacyKeys: Array<keyof Checklist> = ["noIdentifiablePeople", "noVehiclePlates", "noDetailedAddressOrContact", "noPrivateDocumentsOrBelongings", "publicMediaReviewed"];

export function PublishChecklist({ caseId }: { caseId: string }) {
  const { snapshot, updateCase, publishCase, unpublishCase, softDeleteCase } = usePortfolio();
  const item = snapshot.cases.find(({ id }) => id === caseId);
  const [notice, setNotice] = useState("");
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (!item) return null;
  const checks = getPublishChecks(snapshot, caseId);
  const canPublish = checks.every(({ complete }) => complete);
  const toggle = (key: keyof Checklist, checked: boolean) => updateCase(caseId, { privacyChecklist: { ...item.privacyChecklist, [key]: checked } });
  const publish = () => {
    const result = publishCase(caseId);
    if (result?.ok) setNotice("사례를 공개했습니다. 고객 화면에 즉시 반영됩니다.");
    else setNotice("공개 조건을 다시 확인해 주세요.");
  };
  return <section className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5"><h2 className="text-xl font-black">공개 전 개인정보 검토</h2><p className="mt-1 text-sm text-[var(--neutral-500)]">사진과 필수 정보를 모두 확인해야 공개할 수 있습니다.</p><ul className="mt-5 grid gap-3">{checks.map((check) => { const privacyKey = privacyKeys.find((key) => key === check.key); return <li className="flex min-h-11 items-center gap-3" key={check.key}>{privacyKey ? <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={check.complete} onChange={(event) => toggle(privacyKey, event.target.checked)} /><span>{check.label}</span></label> : <>{check.complete ? <CheckCircle2 aria-hidden="true" className="text-green-700" /> : <Circle aria-hidden="true" className="text-[var(--danger-600)]" />}<span>{check.label}</span></>}</li>; })}</ul><div className="mt-6 flex flex-wrap gap-3">{item.status === "published" ? <Button variant="secondary" onClick={() => setUnpublishOpen(true)}>비공개로 전환</Button> : <Button disabled={!canPublish} onClick={publish}>사례 공개</Button>}<Button variant="danger" onClick={() => setDeleteOpen(true)}>사례 삭제</Button></div>{notice ? <p role="status" className="mt-4 rounded-xl bg-[var(--brand-50)] p-3 font-semibold">{notice}</p> : null}<UnpublishDialog open={unpublishOpen} onOpenChange={setUnpublishOpen} onConfirm={() => { unpublishCase(caseId); setNotice("비공개로 전환했습니다."); }} /><DeleteCaseDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => softDeleteCase(caseId)} /></section>;
}

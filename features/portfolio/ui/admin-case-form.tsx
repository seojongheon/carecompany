"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";
import { AutosaveStatus } from "@/components/admin/autosave-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPortfolio as usePortfolio } from "../repository/use-portfolio";
import type { PortfolioCase } from "../model/types";

const FormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요."),
  serviceId: z.string().min(1, "서비스를 선택해 주세요."),
  locationDisplay: z.string().trim().min(1, "표시 지역을 입력해 주세요."),
  summary: z.string(), spaceType: z.string(), problemDescription: z.string(),
  workDescription: z.string(), resultDescription: z.string(), workDate: z.string(),
  displayPeriod: z.string(), seoTitle: z.string().max(120), seoDescription: z.string().max(300),
  featuredRank: z.string().regex(/^$|^\d+$/, "대표 순위는 숫자로 입력해 주세요."),
});
type FormValues = z.infer<typeof FormSchema>;
const FORM_FIELDS = Object.keys(FormSchema.shape) as Array<keyof FormValues>;

function formSignature(values: Partial<FormValues>) {
  return JSON.stringify(FORM_FIELDS.map(key => values[key] ?? ""));
}

const emptyValues: FormValues = {
  title: "", serviceId: "", locationDisplay: "", summary: "", spaceType: "",
  problemDescription: "", workDescription: "", resultDescription: "", workDate: "",
  displayPeriod: "", featuredRank: "", seoTitle: "", seoDescription: "",
};

function valuesFor(item: PortfolioCase): FormValues {
  return {
    title: item.title, serviceId: item.serviceId, locationDisplay: item.locationDisplay,
    summary: item.summary, spaceType: item.spaceType,
    problemDescription: item.problemDescription, workDescription: item.workDescription,
    resultDescription: item.resultDescription, workDate: item.workDate,
    seoTitle: item.seoTitle ?? "", seoDescription: item.seoDescription ?? "",
    displayPeriod: item.displayPeriod, featuredRank: item.featuredRank?.toString() ?? "",
  };
}

export function AdminCaseForm({ mode, caseId, autosaveMs = 800 }: { mode: "create" | "edit"; caseId?: string; autosaveMs?: number }) {
  const { snapshot, createDraft, updateCase, setCaseTags, mutation, clearMutationError, loading, loadError, reload, repository } = usePortfolio();
  const existing = caseId ? snapshot.cases.find(({ id }) => id === caseId) : undefined;
  const [created, setCreated] = useState(false);
  const [comparison, setComparison] = useState<FormValues | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: existing ? valuesFor(existing) : emptyValues });
  const loadedCaseId = useRef(existing?.id);
  const [lastSaved, setLastSaved] = useState(existing ? formSignature(valuesFor(existing)) : "");
  const watchedValues = useWatch({ control: form.control });
  useUnsavedChanges(form.formState.isDirty && formSignature(watchedValues) !== lastSaved || mutation.state === "saving" || mutation.state === "failed");

  useEffect(() => {
    // A save response must not replace newer typing, even when it matches the original defaults.
    if (!existing || loadedCaseId.current === existing.id) return;
    form.reset(valuesFor(existing));
    setLastSaved(formSignature(valuesFor(existing)));
    loadedCaseId.current = existing.id;
  }, [existing, form]);

  useEffect(() => {
    if (mode !== "edit" || !caseId || mutation.state === "saving" || mutation.state === "failed" || comparison) return;
    const timer = window.setTimeout(() => {
      const parsed = FormSchema.safeParse(watchedValues);
      if (parsed.success) {
        const signature = formSignature(parsed.data);
        if (signature === lastSaved) return;
        const { featuredRank, ...values } = parsed.data;
        void updateCase(caseId, { ...values, featuredRank: featuredRank ? Number(featuredRank) : null }).then(result => { if (result) setLastSaved(signature); });
      }
    }, autosaveMs);
    return () => window.clearTimeout(timer);
  }, [autosaveMs, caseId, lastSaved, mode, updateCase, watchedValues, mutation.state, comparison]);

  const submit = form.handleSubmit(async (values) => {
    if (mutation.state === "saving") return;
    if (mode === "create") {
      const result = await createDraft({ serviceId: values.serviceId, title: values.title, locationDisplay: values.locationDisplay });
      if (result) { setCreated(true); form.reset(values); setLastSaved(formSignature(values)); }
    } else if (caseId) {
      const { featuredRank, ...patch } = values;
      const result = await updateCase(caseId, { ...patch, featuredRank: featuredRank ? Number(featuredRank) : null });
      if (result) { setLastSaved(formSignature(values)); setComparison(null); }
    }
  });
  const loadLatest = async () => {
    setComparison(null);
    if (!await reload()) return;
    const latest = caseId ? repository.getAdminCaseById(caseId) : null;
    if (latest) setComparison(valuesFor(latest));
  };
  const fieldNames: Record<keyof FormValues, string> = { title: "제목", serviceId: "서비스", locationDisplay: "표시 지역", summary: "요약", spaceType: "공간 유형", workDate: "작업 날짜", displayPeriod: "표시 시기", featuredRank: "대표 순위", problemDescription: "작업 전 상태", workDescription: "작업 내용", resultDescription: "작업 결과", seoTitle: "SEO 제목", seoDescription: "SEO 설명" };
  const error = (name: keyof FormValues) => form.formState.errors[name]?.message;
  const availableTags = snapshot.tags.filter((tag) => tag.serviceId === watchedValues.serviceId && tag.active);
  const selectedTagIds = caseId ? snapshot.caseTagIds[caseId] ?? [] : [];
  const toggleTag = (tagId: string, checked: boolean) => {
    if (!caseId) return;
    void setCaseTags(caseId, current => checked ? [...new Set([...current, tagId])] : current.filter(id => id !== tagId));
  };

  if (loadError) return <div role="alert">{loadError}<Button onClick={mode === "edit" && existing ? loadLatest : reload}>다시 시도</Button></div>;
  if (loading) return <p role="status">사례를 불러오는 중입니다.</p>;
  if (existing?.status === "deleted") return <h1 className="text-3xl font-black">{existing.title} · 휴지통</h1>;
  if (mode === "edit" && !existing) return <p role="alert">사례를 찾을 수 없습니다.</p>;
  return <form onSubmit={submit} className="mx-auto max-w-3xl">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-black text-[var(--brand-700)]">{mode === "create" ? "NEW PRIVATE DRAFT" : "EDIT CASE"}</p><h1 className="mt-2 text-3xl font-black">{mode === "create" ? "새 사례 만들기" : "사례 편집"}</h1></div>
      {mode === "edit" ? <AutosaveStatus state={mutation.state} message={mutation.message} /> : null}
    </div>
    <div className="grid gap-6 rounded-2xl border border-[var(--neutral-200)] bg-white p-5 md:p-7">
      <Field label="사례 제목" error={error("title")}><Input id="case-title" aria-invalid={Boolean(error("title"))} {...form.register("title")} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="서비스" error={error("serviceId")}><select id="case-service" className="admin-select" aria-invalid={Boolean(error("serviceId"))} {...form.register("serviceId")}><option value="">선택하세요</option>{snapshot.services.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select></Field>
        <Field label="표시 지역" error={error("locationDisplay")}><Input id="case-location" placeholder="예: 천안 서북구" {...form.register("locationDisplay")} /></Field>
      </div>
      {mode === "edit" ? <>
        <Field label="자동 생성된 사례 주소"><Input id="case-slug" value={`/portfolio/${existing?.slug ?? ""}`} readOnly className="bg-[var(--neutral-50)] text-[var(--neutral-600)]" /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="작업 날짜"><Input id="case-work-date" type="date" {...form.register("workDate")} /></Field><Field label="고객 표시 시기"><Input id="case-display-period" placeholder="예: 2026년 7월" {...form.register("displayPeriod")} /></Field></div>
        <Field label="대표 사례 순위" error={error("featuredRank")}><Input id="case-featured-rank" type="number" min="1" placeholder="비워 두면 일반 정렬" {...form.register("featuredRank")} /></Field>
        <fieldset><legend className="font-semibold">주요 태그</legend><div className="mt-2 flex flex-wrap gap-2">{availableTags.map((tag) => <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--neutral-200)] px-3" key={tag.id}><input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={(event) => toggleTag(tag.id, event.target.checked)} />{tag.name}</label>)}</div></fieldset>
        <Field label="요약"><Textarea id="case-summary" {...form.register("summary")} /></Field>
        <Field label="공간 유형"><Input id="case-space" {...form.register("spaceType")} /></Field>
        <Field label="작업 전 상태"><Textarea id="case-problem" {...form.register("problemDescription")} /></Field>
        <Field label="작업 내용"><Textarea id="case-work" {...form.register("workDescription")} /></Field>
        <Field label="작업 결과"><Textarea id="case-result" {...form.register("resultDescription")} /></Field>
        <Field label="SEO 제목" error={error("seoTitle")}><Input id="case-seo-title" {...form.register("seoTitle")} /></Field>
        <Field label="SEO 설명" error={error("seoDescription")}><Textarea id="case-seo-description" {...form.register("seoDescription")} /></Field>
        <div className="rounded-xl bg-slate-50 p-4"><h2 className="font-bold">검색 결과 미리보기</h2><p className="mt-2 text-lg text-blue-800">{watchedValues.seoTitle || watchedValues.title}</p><p className="text-sm">/portfolio/{existing?.slug}</p><p className="mt-1 text-sm text-slate-600">{watchedValues.seoDescription || watchedValues.summary}</p></div>
      </> : null}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between border-t border-[var(--neutral-200)] bg-white/95 p-4 backdrop-blur md:-mx-7 md:-mb-7"><p className="text-sm text-[var(--neutral-500)]">{existing?.status === "published" ? "수정은 초안으로 저장되며 재공개할 때 반영됩니다." : "처음에는 고객에게 보이지 않는 비공개 상태입니다."}</p><Button type="submit" disabled={form.formState.isSubmitting || mutation.state === "saving"}>{mode === "create" ? "비공개 초안 만들기" : "지금 저장"}</Button></div>
    </div>
    {mutation.state === "failed" ? <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4">{mutation.message}<Button type="button" variant="secondary" onClick={loadLatest}>최신 버전 불러오기</Button></div> : null}
    {comparison ? <section className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4"><h2 className="font-bold">최신 저장 내용과 내 입력 비교</h2><dl className="mt-3 grid gap-3">{(Object.keys(comparison) as Array<keyof FormValues>).filter(key => comparison[key] !== watchedValues[key]).map(key => <div key={key}><dt className="font-semibold">{fieldNames[key]}</dt><dd className="whitespace-pre-wrap text-sm">최신 저장: {comparison[key] || "비어 있음"}</dd><dd className="whitespace-pre-wrap text-sm">내 입력: {watchedValues[key] || "비어 있음"}</dd></div>)}</dl><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={mutation.state === "saving"} onClick={() => { form.reset(comparison); setLastSaved(formSignature(comparison)); setComparison(null); clearMutationError(); }}>최신 내용으로 입력 바꾸기</Button><Button type="submit" disabled={form.formState.isSubmitting || mutation.state === "saving"}>내 입력 다시 저장</Button></div></section> : null}
    {created ? <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 font-semibold text-green-800">비공개 초안을 만들었습니다. 사례 목록에서 계속 편집할 수 있습니다.</p> : null}
  </form>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactElement<{ id?: string }> }) {
  const id = children.props.id;
  return <div><Label htmlFor={id}>{label}</Label>{children}{error ? <p className="mt-1 text-sm font-semibold text-[var(--danger-600)]">{error}</p> : null}</div>;
}

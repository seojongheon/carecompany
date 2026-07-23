"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { AutosaveStatus } from "@/components/admin/autosave-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolio } from "../repository/use-portfolio";
import type { PortfolioCase } from "../model/types";

const FormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요."),
  serviceId: z.string().min(1, "서비스를 선택해 주세요."),
  locationDisplay: z.string().trim().min(1, "표시 지역을 입력해 주세요."),
  summary: z.string(), spaceType: z.string(), problemDescription: z.string(),
  workDescription: z.string(), resultDescription: z.string(), workDate: z.string(),
  displayPeriod: z.string(),
  featuredRank: z.string().regex(/^$|^\d+$/, "대표 순위는 숫자로 입력해 주세요."),
  seoTitle: z.string(), seoDescription: z.string(),
});
type FormValues = z.infer<typeof FormSchema>;

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
    displayPeriod: item.displayPeriod, featuredRank: item.featuredRank?.toString() ?? "",
    seoTitle: item.seoTitle ?? "", seoDescription: item.seoDescription ?? "",
  };
}

export function AdminCaseForm({ mode, caseId, autosaveMs = 800 }: { mode: "create" | "edit"; caseId?: string; autosaveMs?: number }) {
  const { snapshot, createDraft, updateCase, setCaseTags, mutation } = usePortfolio();
  const existing = caseId ? snapshot.cases.find(({ id }) => id === caseId) : undefined;
  const [created, setCreated] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: existing ? valuesFor(existing) : emptyValues });
  const loadedVersion = useRef(existing ? `${existing.id}:${existing.updatedAt}` : undefined);
  const [lastSaved, setLastSaved] = useState(existing ? JSON.stringify(valuesFor(existing)) : "");
  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    const version = existing ? `${existing.id}:${existing.updatedAt}` : undefined;
    if (!existing || loadedVersion.current === version || form.formState.isDirty) return;
    form.reset(valuesFor(existing));
    setLastSaved(JSON.stringify(valuesFor(existing)));
    loadedVersion.current = version;
  }, [existing, form]);

  useEffect(() => {
    if (mode !== "edit" || !caseId) return;
    const timer = window.setTimeout(() => {
      const parsed = FormSchema.safeParse(watchedValues);
      if (parsed.success) {
        const signature = JSON.stringify(parsed.data);
        if (signature === lastSaved) return;
        const { featuredRank, ...values } = parsed.data;
        setLastSaved(signature);
        updateCase(caseId, { ...values, featuredRank: featuredRank ? Number(featuredRank) : null });
      }
    }, autosaveMs);
    return () => window.clearTimeout(timer);
  }, [autosaveMs, caseId, lastSaved, mode, updateCase, watchedValues]);

  const submit = form.handleSubmit(async (values) => {
    if (mode === "create") {
      const result = await createDraft({ serviceId: values.serviceId, title: values.title, locationDisplay: values.locationDisplay });
      if (result) setCreated(true);
    } else if (caseId) {
      const { featuredRank, ...patch } = values;
      setLastSaved(JSON.stringify(values));
      await updateCase(caseId, { ...patch, featuredRank: featuredRank ? Number(featuredRank) : null });
    }
  });
  const error = (name: keyof FormValues) => form.formState.errors[name]?.message;
  const availableTags = snapshot.tags.filter((tag) => tag.serviceId === watchedValues.serviceId && tag.active);
  const selectedTagIds = caseId ? snapshot.caseTagIds[caseId] ?? [] : [];

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
        <fieldset><legend className="font-semibold">주요 태그</legend><div className="mt-2 flex flex-wrap gap-2">{availableTags.map((tag) => <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--neutral-200)] px-3" key={tag.id}><input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={(event) => setCaseTags(caseId!, event.target.checked ? [...selectedTagIds, tag.id] : selectedTagIds.filter((id) => id !== tag.id))} />{tag.name}</label>)}</div></fieldset>
        <Field label="요약"><Textarea id="case-summary" {...form.register("summary")} /></Field>
        <Field label="공간 유형"><Input id="case-space" {...form.register("spaceType")} /></Field>
        <Field label="작업 전 상태"><Textarea id="case-problem" {...form.register("problemDescription")} /></Field>
        <Field label="작업 내용"><Textarea id="case-work" {...form.register("workDescription")} /></Field>
        <Field label="작업 결과"><Textarea id="case-result" {...form.register("resultDescription")} /></Field>
        <div className="rounded-2xl bg-[var(--neutral-50)] p-4"><h2 className="font-black">SEO 정보</h2><p className="mb-4 mt-1 text-sm text-[var(--neutral-500)]">비우면 사례 제목·요약·자동 생성 주소와 대표 사진으로 자동 생성합니다.</p><div className="grid gap-4"><Field label="SEO 제목"><Input id="case-seo-title" {...form.register("seoTitle")} /></Field><Field label="SEO 설명"><Textarea id="case-seo-description" {...form.register("seoDescription")} /></Field></div></div>
      </> : null}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between border-t border-[var(--neutral-200)] bg-white/95 p-4 backdrop-blur md:-mx-7 md:-mb-7"><p className="text-sm text-[var(--neutral-500)]">처음에는 고객에게 보이지 않는 비공개 상태입니다.</p><Button type="submit" disabled={form.formState.isSubmitting}>{mode === "create" ? "비공개 초안 만들기" : "지금 저장"}</Button></div>
    </div>
    {created ? <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 font-semibold text-green-800">비공개 초안을 만들었습니다. 사례 목록에서 계속 편집할 수 있습니다.</p> : null}
  </form>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactElement<{ id?: string }> }) {
  const id = children.props.id;
  return <div><Label htmlFor={id}>{label}</Label>{children}{error ? <p className="mt-1 text-sm font-semibold text-[var(--danger-600)]">{error}</p> : null}</div>;
}

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminPortfolio } from "../repository/use-portfolio";
import type { Tag, TagType } from "../model/types";

export function AdminTagManager() {
 const { snapshot, saveTag, mutation } = useAdminPortfolio();
 const [editing, setEditing] = useState<Tag | null>(null);
 const [error, setError] = useState("");
 const save = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault(); const target = event.currentTarget; const data = new FormData(target);
  const tag: Tag = { id: editing?.id ?? crypto.randomUUID(), serviceId: editing?.serviceId ?? String(data.get("serviceId")), key: String(data.get("key")).trim(), name: String(data.get("name")).trim(), type: editing?.type ?? String(data.get("type")) as TagType, sortOrder: Number(data.get("sortOrder")), active: data.get("active") === "on" };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag.key) || !tag.name || !tag.serviceId || !Number.isInteger(tag.sortOrder) || tag.sortOrder < 0) { setError("서비스, 이름, 영문 소문자 키, 0 이상의 순서를 확인해 주세요."); return; }
  if (await saveTag(tag)) { setEditing(null); setError(""); target.reset(); }
 };
 return <details id="case-tags" className="admin-card mt-6 rounded-2xl border border-[var(--neutral-200)] bg-white p-5"><summary className="min-h-11 cursor-pointer font-bold">서비스별 태그 관리</summary>
  <div className="my-4 flex flex-wrap gap-2">{snapshot.tags.map(tag => <Button key={tag.id} variant="secondary" size="sm" onClick={() => setEditing(tag)}>{tag.name}{tag.active ? "" : " (숨김)"}</Button>)}</div>
  <form key={editing?.id ?? "new"} onSubmit={save} className="grid gap-3 sm:grid-cols-2">
   <label>서비스<select disabled={Boolean(editing)} name="serviceId" className="admin-select" defaultValue={editing?.serviceId ?? snapshot.services[0]?.id}>{snapshot.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>태그 이름<Input name="name" defaultValue={editing?.name} required /></label>
   <label>영문 키<Input name="key" defaultValue={editing?.key} readOnly={Boolean(editing)} placeholder="example-tag" required /></label>
   <label>분류<select disabled={Boolean(editing)} name="type" className="admin-select" defaultValue={editing?.type ?? "space"}><option value="space">공간</option><option value="contamination">오염</option><option value="scope">작업 범위</option></select></label>
   <label>순서<Input name="sortOrder" type="number" min="0" defaultValue={editing?.sortOrder ?? 0} required /></label>
   <label className="flex min-h-11 items-center gap-2"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />사용</label>
   <Button disabled={mutation.state === "saving"} type="submit">{editing ? "태그 수정" : "태그 추가"}</Button>{editing ? <Button variant="secondary" type="button" onClick={() => setEditing(null)}>새 태그 입력</Button> : null}
   {error ? <p role="alert">{error}</p> : null}{mutation.state === "failed" ? <p role="alert">{mutation.message}</p> : null}
  </form>
 </details>;
}

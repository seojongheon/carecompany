"use client";

import { useEffect, useState } from "react";
import { EXTERNAL_CHANNELS, NOTIFICATION_EVENTS, type ExternalChannelSettings, type NotificationSettings as Settings, type NotificationOutbox } from "../model/notification";
import type { StaffOption } from "@/features/inquiries/model/inquiry";

const labels = { "inquiry.created": "새 문의 접수", "inquiry.assigned": "담당자 배정", "operation.failed": "처리 실패" };
const channelLabels = { email: "이메일", sms: "SMS", kakao: "카카오" };

function RecipientFields({ recipients, staff, onChange }: { recipients: string[]; staff: StaffOption[]; onChange: (value: string[]) => void }) {
  const inactive = recipients.filter(id => !staff.some(user => user.id === id));
  return <div className="mt-2 grid gap-2 sm:grid-cols-2">{staff.map(user => <label key={user.id} className="flex min-h-11 items-center gap-2 break-all text-sm"><input type="checkbox" className="size-5 shrink-0" checked={recipients.includes(user.id)} onChange={event => onChange(event.target.checked ? [...recipients, user.id] : recipients.filter(value => value !== user.id))} />{user.email}</label>)}{inactive.map(id => <label key={id} className="flex min-h-11 items-center gap-2 break-all text-sm text-amber-800"><input type="checkbox" aria-label={`비활성 수신자 ${id}`} className="size-5 shrink-0" checked onChange={() => onChange(recipients.filter(value => value !== id))} /><span>비활성 또는 권한 변경된 수신자 · {id}<span className="block text-xs">선택을 해제한 후 저장해 주세요.</span></span></label>)}</div>;
}

function EventFields({ events, onChange }: { events: Settings["events"]; onChange: (value: Settings["events"]) => void }) {
  return <div className="mt-2 flex flex-wrap gap-4">{NOTIFICATION_EVENTS.map(event => <label key={event} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-5" checked={events.includes(event)} onChange={e => onChange(e.target.checked ? [...events, event] : events.filter(value => value !== event))} />{labels[event]}</label>)}</div>;
}

function ChannelFields({ label, value, staff, onChange }: { label: string; value: ExternalChannelSettings; staff: StaffOption[]; onChange: (value: ExternalChannelSettings) => void }) {
  return <details className="rounded-xl border bg-[var(--neutral-50)] p-4">
    <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-bold"><span>{label} 외부 발송</span><span className="font-normal text-[var(--neutral-600)]">연결되지 않음 · 비활성</span></summary>
    <p className="mt-3 text-xs leading-6 text-[var(--neutral-600)]">발송 업체가 연결되기 전에는 활성화하거나 전송할 수 없습니다. 현재 이벤트를 발송 대기열에 쌓지 않습니다.</p>
    <fieldset className="mt-4"><legend className="text-sm font-bold">{label} 운영 수신자</legend><p className="mt-2 text-xs text-[var(--neutral-500)]">미선택 시 모든 활성 관리자 대상입니다. 고객 수신자는 지정할 수 없습니다.</p><RecipientFields recipients={value.recipients} staff={staff} onChange={recipients => onChange({ ...value, recipients })} /></fieldset>
    <fieldset className="mt-4"><legend className="text-sm font-bold">{label} 이벤트</legend><EventFields events={value.events} onChange={events => onChange({ ...value, events })} /></fieldset>
    <label className="mt-4 grid gap-2 text-sm">{label} 템플릿 참조<input value={value.templateReference} maxLength={200} onChange={event => onChange({ ...value, templateReference: event.target.value })} placeholder="템플릿 이름 또는 참조 ID (선택)" className="min-h-11 rounded-lg border bg-white px-3" /></label>
    <p className="mt-2 text-xs text-[var(--neutral-500)]">API 키나 비밀번호를 입력하지 마세요.</p>
  </details>;
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [outbox, setOutbox] = useState<NotificationOutbox[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/notifications/settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSettings(data.settings); setStaff(data.staff); setOutbox(data.outbox);
    } catch (error) { setError(error instanceof Error ? error.message : "설정을 불러오지 못했습니다."); }
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  async function save() {
    if (!settings) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/notifications/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage("운영 알림 설정을 저장했습니다.");
    } catch (error) { setError(error instanceof Error ? error.message : "저장에 실패했습니다."); }
    finally { setBusy(false); }
  }

  return <section className="space-y-5 rounded-2xl border bg-white p-5 sm:p-6">
    <header><h2 className="text-xl font-black">운영 알림 설정</h2><p className="mt-2 text-sm leading-6 text-[var(--neutral-600)]">관리자 화면의 알림 수신 대상과 이벤트를 관리합니다. 외부 발송은 채널별로 설정하며, 고객에게 발송되는 알림은 없습니다.</p></header>
    {error && <div role="alert" className="text-sm text-red-700">{error}<button onClick={() => void load()} className="ml-3 min-h-11 underline">다시 불러오기</button></div>}
    {!settings && !error && <p role="status">설정을 불러오는 중…</p>}
    {settings && <>
      <fieldset><legend className="text-sm font-bold">화면 내 알림 이벤트</legend><EventFields events={settings.events} onChange={events => setSettings({ ...settings, events })} /></fieldset>
      <fieldset><legend className="text-sm font-bold">화면 내 새 문의·실패 알림 수신자</legend><p className="mt-2 text-xs text-[var(--neutral-500)]">선택하지 않으면 모든 활성 관리자에게 전달합니다. 담당 배정 알림은 해당 담당자에게 전달합니다.</p><RecipientFields recipients={settings.recipients} staff={staff} onChange={recipients => setSettings({ ...settings, recipients })} /></fieldset>
      <div className="space-y-3">{EXTERNAL_CHANNELS.map(channel => <ChannelFields key={channel} label={channelLabels[channel]} value={settings.externalChannels[channel]} staff={staff} onChange={value => setSettings({ ...settings, externalChannels: { ...settings.externalChannels, [channel]: value } })} />)}</div>
      <button onClick={save} disabled={busy} className="min-h-11 rounded-lg bg-[var(--brand-600)] px-5 font-bold text-white disabled:opacity-50">{busy ? "저장 중…" : "알림 설정 저장"}</button>
      {message && <p role="status" className="text-sm text-[var(--brand-700)]">{message}</p>}
      <div><h3 className="text-sm font-bold">외부 발송 기록</h3><p className="mt-2 text-sm text-[var(--neutral-500)]">{outbox.length === 0 ? "발송 기록이 없습니다. 외부 공급자가 연결되지 않았습니다." : `최근 발송 경계 기록 ${outbox.length}건`}</p></div>
    </>}
  </section>;
}

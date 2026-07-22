"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseYouTubeUrl } from "@/lib/youtube";
import { usePortfolio } from "../repository/use-portfolio";

export function YouTubeManager({ caseId }: { caseId: string }) {
  const { snapshot, setCaseVideos } = usePortfolio();
  const videos = snapshot.videos.filter((item) => item.caseId === caseId).sort((a, b) => a.sortOrder - b.sortOrder);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const add = () => {
    const parsed = parseYouTubeUrl(url);
    if (!parsed) { setError("지원하는 YouTube 주소를 입력해 주세요."); return; }
    setCaseVideos(caseId, [...videos, { id: `video-${crypto.randomUUID()}`, caseId, youtubeVideoId: parsed.videoId, originalUrl: parsed.canonicalUrl, title: `작업 영상 ${videos.length + 1}`, caption: "", sortOrder: videos.length, public: false }]);
    setUrl(""); setError("");
  };
  const patch = (id: string, changes: Partial<(typeof videos)[number]>) => setCaseVideos(caseId, videos.map((video) => video.id === id ? { ...video, ...changes } : video));
  const updateUrl = (id: string, nextUrl: string) => {
    const parsed = parseYouTubeUrl(nextUrl);
    if (!parsed) { setError("수정한 영상 주소가 올바르지 않습니다."); return; }
    patch(id, { youtubeVideoId: parsed.videoId, originalUrl: parsed.canonicalUrl });
    setError("");
  };
  const move = (index: number, direction: -1 | 1) => {
    const next = [...videos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCaseVideos(caseId, next.map((video, sortOrder) => ({ ...video, sortOrder })));
  };
  return <section className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5"><h2 className="text-xl font-black">YouTube 영상</h2><p className="mt-1 text-sm text-[var(--neutral-500)]">일반·단축·Shorts 주소, 최대 3개</p><div className="mt-4 flex gap-2"><div className="flex-1"><Label htmlFor="youtube-url">YouTube 주소</Label><Input id="youtube-url" value={url} onChange={(event) => setUrl(event.target.value)} aria-invalid={Boolean(error)} /></div><Button className="self-end" onClick={add} disabled={videos.length >= 3}>영상 추가</Button></div>{error ? <p role="alert" className="mt-2 text-sm font-semibold text-[var(--danger-600)]">{error}</p> : null}<ul className="mt-4 grid gap-3">{videos.map((video, index) => <li data-testid="youtube-item" className="grid gap-3 rounded-xl bg-[var(--neutral-50)] p-3 sm:grid-cols-[9rem_1fr_auto] sm:items-center" key={video.id}><a href={video.originalUrl} target="_blank" rel="noreferrer" aria-label={`${video.title} 원본 YouTube 열기`}><Image src={`https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`} alt={`${video.title} 미리보기`} width={320} height={180} unoptimized className="aspect-video w-full rounded-lg object-cover" /></a><div className="grid gap-2"><Label htmlFor={`video-url-${video.id}`}>영상 주소</Label><Input id={`video-url-${video.id}`} defaultValue={video.originalUrl} onBlur={(event) => updateUrl(video.id, event.target.value)} /><Label htmlFor={`video-title-${video.id}`}>영상 제목</Label><Input id={`video-title-${video.id}`} defaultValue={video.title} onBlur={(event) => patch(video.id, { title: event.target.value })} /><Label htmlFor={`video-caption-${video.id}`}>짧은 설명</Label><Input id={`video-caption-${video.id}`} defaultValue={video.caption} onBlur={(event) => patch(video.id, { caption: event.target.value })} /><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" aria-label={`${video.title} 영상 공개`} checked={video.public} onChange={(event) => patch(video.id, { public: event.target.checked })} />고객 공개</label></div><div className="flex"><Button variant="ghost" size="icon" aria-label={`${video.title} 위로 이동`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button><Button variant="ghost" size="icon" aria-label={`${video.title} 아래로 이동`} disabled={index === videos.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button><Button variant="ghost" size="icon" aria-label={`${video.title} 삭제`} onClick={() => setCaseVideos(caseId, videos.filter(({ id }) => id !== video.id).map((item, sortOrder) => ({ ...item, sortOrder })))}><Trash2 /></Button></div></li>)}</ul></section>;
}

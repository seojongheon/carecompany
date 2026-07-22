"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import type { CaseVideo } from "@/features/portfolio/model/types";

export function YouTubeLazy({ video }: { video: CaseVideo }) {
  const [active, setActive] = useState(false);
  const source = `https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?rel=0`;
  return <div className="overflow-hidden rounded-2xl bg-[var(--neutral-900)]">{active ? <div className="aspect-video"><iframe className="h-full w-full" src={source} title={`${video.title} YouTube 영상`} allow="fullscreen; picture-in-picture" allowFullScreen /></div> : <button type="button" aria-label={`${video.title} 영상 재생`} onClick={() => setActive(true)} className="group relative grid aspect-video w-full place-items-center bg-[linear-gradient(135deg,#1d3849,#111827)] text-white"><span className="grid h-16 w-16 place-items-center rounded-full bg-white text-[var(--brand-700)] transition group-hover:scale-105"><Play aria-hidden="true" fill="currentColor" /></span><span className="absolute bottom-4 left-4 right-4 text-left font-bold">{video.title}</span></button>}{video.caption ? <p className="bg-white p-4 text-sm text-[var(--neutral-600)]">{video.caption}</p> : null}</div>;
}


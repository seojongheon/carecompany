"use client";
import type {ReactNode} from "react";

export function AdminDisclosureButton({targetId,children}:{targetId:string;children:ReactNode}) {
 function reveal() {
  const target=document.getElementById(targetId);
  if(!(target instanceof HTMLDetailsElement))return;
  target.open=true;
  target.scrollIntoView({block:"start"});
  target.querySelector<HTMLInputElement>('input:not([type="hidden"])')?.focus({preventScroll:true});
 }
 return <button type="button" onClick={reveal} className="inline-flex min-h-11 items-center rounded-xl bg-[var(--brand-600)] px-5 text-sm font-semibold text-white">{children}</button>;
}

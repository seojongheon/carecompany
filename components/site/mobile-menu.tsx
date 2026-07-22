"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { servicePath } from "@/lib/routes";
import { CustomerAuthNav } from "@/features/auth/ui/customer-auth-nav";

export function MobileMenu() {
  return <Sheet><SheetTrigger asChild><Button className="lg:hidden" variant="ghost" size="icon" aria-label="메뉴 열기"><Menu aria-hidden="true" /></Button></SheetTrigger><SheetContent aria-describedby={undefined}><SheetTitle className="pr-12 text-xl font-black">전체 메뉴</SheetTitle><nav aria-label="모바일 메뉴" className="mt-8 grid gap-1"><strong className="mb-2 text-sm text-[var(--neutral-500)]">청소 서비스</strong>{SEED_SNAPSHOT.services.map((service) => <Link className="flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]" href={servicePath(service.key)} key={service.id}>{service.name}</Link>)}<Link className="mt-3 flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]" href="/portfolio">전체 사례</Link><Link className="flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]" href="/pricing">가격 안내</Link><Link className="flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]" href="/process">작업 과정</Link><Link className="flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-[var(--neutral-100)]" href="/about">업체 소개</Link><CustomerAuthNav mobile /></nav></SheetContent></Sheet>;
}

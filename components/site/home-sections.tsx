"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { PortfolioGrid } from "@/features/portfolio/ui/portfolio-grid";
import { ServiceCard } from "./service-card";
import { useSiteContent } from "@/features/site-content/repository/site-content-provider";
import { RecommendedCases } from "@/features/site-content/ui/recommended-cases";
import { ContentState } from "@/features/site-content/ui/content-state";

export function HomeSections() {
 const{snapshot,loading,error}=useSiteContent();if(loading||error)return <ContentState/>;
 const home=snapshot.published.home;
 const services=snapshot.published.services?.map(item=>({...SEED_SNAPSHOT.services.find(service=>service.key===item.key)!,...item}))??SEED_SNAPSHOT.services;
 const blocks=home.blocks??[{key:"services",visible:true,sortOrder:0},{key:"recent",visible:true,sortOrder:1},{key:"recommendations",visible:true,sortOrder:2},{key:"additional",visible:true,sortOrder:3}];
 return <main id="main-content"><section className="hero-section"><div className="page-shell grid items-center gap-10 py-18 lg:grid-cols-[1.1fr_.9fr] lg:py-28"><div><span className="eyebrow">{home.eyebrow}</span><h1 className="mt-5 text-4xl font-black leading-[1.15] tracking-[-0.05em] sm:text-6xl">{home.title}</h1><p className="mt-6 max-w-xl text-lg text-neutral-600">{home.description}</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild><a href={home.primaryCtaHref}>{home.primaryCtaLabel}<ArrowRight aria-hidden="true" size={18}/></a></Button><Button asChild variant="secondary"><Link href="/process">작업 과정 확인</Link></Button></div><ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold"><li className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" size={18}/>현장별 공개 검토</li><li className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" size={18}/>과장 없는 작업 기록</li></ul></div><div className="hero-art" role="img" aria-label={home.image?.alt||home.heroImageAlt} style={home.image?.url||home.heroImageUrl?{backgroundImage:`url(${home.image?.url||home.heroImageUrl})`,backgroundSize:"cover",backgroundPosition:`${home.image?.focalX??50}% ${home.image?.focalY??50}%`}:undefined}>{!home.image?.url&&!home.heroImageUrl&&<div className="hero-art-card"><Sparkles size={56}/><strong>깨끗함을<br/>확인하는 기술</strong></div>}</div></div></section>
 {blocks.filter(block=>block.visible).sort((a,b)=>a.sortOrder-b.sortOrder).map(block=>{
  if(block.key==="services")return <section key={block.key} className="section-space"><div className="page-shell"><div className="section-heading"><div><span className="eyebrow">SERVICES</span><h2>필요한 청소를 바로 선택하세요</h2></div><Link href="/services" className="section-link">서비스 전체 보기<ArrowRight aria-hidden="true" size={17}/></Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.filter(service=>service.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(service=><ServiceCard key={service.id} service={service}/>)}</div></div></section>;
  if(block.key==="recent")return <section key={block.key} className="section-space bg-neutral-50"><div className="page-shell"><div className="section-heading"><div><span className="eyebrow">PORTFOLIO</span><h2>최근 공개 작업 사례</h2><p>공개 가능한 사진만 골라 보여드립니다.</p></div><Link href="/portfolio" className="section-link">모든 사례 보기<ArrowRight aria-hidden="true" size={17}/></Link></div><PortfolioGrid initialLimit={6}/></div></section>;
  if(block.key==="recommendations")return home.recommendations?.length?<RecommendedCases key={block.key} ids={home.recommendations}/>:null;
  return <div key={block.key}>{home.sections?.filter(section=>section.visible).sort((a,b)=>a.sortOrder-b.sortOrder).map(section=><section key={section.id} className="page-shell py-10"><h2 className="text-3xl font-black">{section.title}</h2><p className="mt-4">{section.description}</p></section>)}</div>;
 })}</main>;
}

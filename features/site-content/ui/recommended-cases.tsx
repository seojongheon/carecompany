"use client";
import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";
import { selectPublicCases } from "@/features/portfolio/selectors/portfolio-selectors";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
export function RecommendedCases({ids}:{ids:string[]}){const{snapshot,loading,loadError}=usePortfolio();if(loading||loadError)return null;const publicCases=selectPublicCases(snapshot,{limit:1000}).items;const cases=ids.map(id=>publicCases.find(item=>item.id===id)).filter(item=>item!==undefined);if(!cases.length)return null;return <section className="section-space"><div className="page-shell"><h2 className="mb-6 text-3xl font-black">추천 작업 사례</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cases.map(item=><PortfolioCard key={item.id} item={item}/>)}</div></div></section>;}

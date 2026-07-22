"use client";

import { notFound } from "next/navigation";
import { selectPublicCaseBySlug, selectRelatedPublicCases } from "../selectors/portfolio-selectors";
import { usePortfolio } from "../repository/use-portfolio";
import { CaseDetail } from "./case-detail";

export function ClientCaseRoute({ slug }: { slug: string }) {
  const { snapshot } = usePortfolio();
  const detail = selectPublicCaseBySlug(snapshot, slug);
  if (!detail) notFound();
  return <CaseDetail detail={detail} related={selectRelatedPublicCases(snapshot, detail.id, 3)} />;
}


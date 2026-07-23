"use client";

import type { PublicCaseDetail } from "../model/types";
import { selectPublicCaseBySlug, selectRelatedPublicCases } from "../selectors/portfolio-selectors";
import { usePortfolio } from "../repository/use-portfolio";
import { CaseDetail } from "./case-detail";

export function ClientCaseRoute({ slug, initialDetail }: { slug: string; initialDetail: PublicCaseDetail }) {
  const { snapshot } = usePortfolio();
  const detail = selectPublicCaseBySlug(snapshot, slug) ?? initialDetail;
  return <CaseDetail detail={detail} related={selectRelatedPublicCases(snapshot, detail.id, 3)} />;
}

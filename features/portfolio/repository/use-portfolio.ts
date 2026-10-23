"use client";

import { useContext, useMemo } from "react";

import { selectAdminSnapshot } from "../model/case-revisions";
import { PortfolioContext } from "./portfolio-provider";

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio는 PortfolioProvider 안에서 사용해야 합니다.");
  }
  return context;
}


export function useAdminPortfolio() {
  const context = usePortfolio();
  const snapshot = useMemo(() => selectAdminSnapshot(context.snapshot), [context.snapshot]);
  return { ...context, snapshot };
}

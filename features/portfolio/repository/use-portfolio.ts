"use client";

import { useContext } from "react";

import { PortfolioContext } from "./portfolio-provider";

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio는 PortfolioProvider 안에서 사용해야 합니다.");
  }
  return context;
}


"use client";

import { X } from "lucide-react";
import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";

export function RecoveryNotice() {
  const { recoveryNotice, dismissRecoveryNotice } = usePortfolio();
  if (!recoveryNotice) return null;
  return <div role="status" className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{recoveryNotice}</p><button aria-label="복구 안내 닫기" onClick={dismissRecoveryNotice}><X aria-hidden="true" size={18} /></button></div>;
}


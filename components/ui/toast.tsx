"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface ToastMessage { id: number; title: string; description?: string }
interface ToastInput { title: string; description?: string }
const ToastContext = createContext<{ toast(input: ToastInput): void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const value = useMemo(() => ({
    toast(input: ToastInput) {
      const id = Date.now() + Math.random();
      setMessages((current) => [...current, { id, ...input }]);
      window.setTimeout(() => setMessages((current) => current.filter((message) => message.id !== id)), 4000);
    },
  }), []);
  return <ToastContext.Provider value={value}>{children}<div className="fixed bottom-5 right-5 z-[80] grid gap-2" aria-live="polite">{messages.map((message) => <div role="status" className="max-w-sm rounded-xl bg-[var(--neutral-900)] px-4 py-3 text-white shadow-xl" key={message.id}><strong className="block">{message.title}</strong>{message.description ? <span className="text-sm text-white/80">{message.description}</span> : null}</div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast는 ToastProvider 안에서 사용해야 합니다.");
  return context;
}


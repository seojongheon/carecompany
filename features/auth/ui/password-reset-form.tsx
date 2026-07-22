"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../repository/auth-provider";

export function PasswordResetForm() {
  const id = useId();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return <form className="grid gap-5" onSubmit={async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await requestPasswordReset(email);
    setMessage(result.message);
    setPending(false);
  }}>
    <div><Label htmlFor={id}>이메일</Label><Input id={id} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></div>
    {message ? <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{message}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? "요청 중..." : "재설정 안내 받기"}</Button>
    <Link className="text-center text-sm font-bold text-[var(--brand-700)]" href="/login">로그인으로 돌아가기</Link>
  </form>;
}

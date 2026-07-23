"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return <form className="grid gap-5" onSubmit={async (event) => {
    event.preventDefault();
    if (password.length < 12 || password !== confirm) {
      setMessage("12자 이상의 동일한 비밀번호를 입력해 주세요.");
      return;
    }
    setPending(true);
    const { error } = await createBrowserSupabaseClient().auth.updateUser({ password });
    setPending(false);
    setMessage(error ? "비밀번호를 변경하지 못했습니다. 재설정 링크를 다시 요청해 주세요." : "비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.");
  }}>
    <div><Label htmlFor="new-password">새 비밀번호</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
    <div><Label htmlFor="new-password-confirm">새 비밀번호 확인</Label><Input id="new-password-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div>
    {message ? <p role="status" className="text-sm font-semibold">{message}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? "변경 중..." : "비밀번호 변경"}</Button>
  </form>;
}

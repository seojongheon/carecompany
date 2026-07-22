"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../repository/auth-provider";
export function AdminLoginForm() { const { signInAdmin } = useAuth(); const emailId = useId(); const passwordId = useId(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState<string | null>(null); return <form className="grid gap-5" onSubmit={async (event) => { event.preventDefault(); const result = await signInAdmin({ email, password }); setMessage(result.ok ? "로그인되었습니다." : result.message); }}><div><Label htmlFor={emailId}>관리자 이메일</Label><Input id={emailId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></div><div><Label htmlFor={passwordId}>관리자 비밀번호</Label><Input id={passwordId} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></div>{message ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{message}</p> : null}<Button type="submit">로그인</Button><p className="text-xs text-[var(--neutral-500)]">관리자 계정은 공개 회원가입으로 생성할 수 없습니다.</p></form>; }

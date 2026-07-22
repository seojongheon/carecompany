"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../repository/auth-provider";
export function CustomerLoginForm() { const { signInCustomer } = useAuth(); const emailId = useId(); const passwordId = useId(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState<string | null>(null); return <form className="grid gap-5" onSubmit={async (event) => { event.preventDefault(); const result = await signInCustomer({ email, password }); setMessage(result.ok ? "로그인되었습니다." : result.message); }}><div><Label htmlFor={emailId}>이메일</Label><Input id={emailId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div><Label htmlFor={passwordId}>비밀번호</Label><Input id={passwordId} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>{message ? <p role="status" className="text-sm font-semibold">{message}</p> : null}<Button type="submit">로그인</Button><div className="flex justify-between text-sm"><Link href="/forgot-password">비밀번호를 잊으셨나요?</Link><Link className="font-bold text-[var(--brand-700)]" href="/signup">회원가입</Link></div></form>; }

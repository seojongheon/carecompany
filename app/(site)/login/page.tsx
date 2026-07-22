import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { CustomerLoginForm } from "@/features/auth/ui/customer-login-form";

export const metadata: Metadata = { title: "로그인", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthShell eyebrow="고객 계정" title="로그인" description="저장한 계정으로 위생의 기술 서비스를 이용해 주세요."><CustomerLoginForm /></AuthShell>; }

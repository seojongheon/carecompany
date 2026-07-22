import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { AdminLoginForm } from "@/features/auth/ui/admin-login-form";

export const metadata: Metadata = { title: "관리자 로그인", robots: { index: false, follow: false } };
export default function AdminLoginPage() { return <AuthShell eyebrow="관리자 전용" title="관리자 로그인" description="관리자 계정은 공개 가입할 수 없으며, Supabase 연동 후 승인된 계정만 사용할 수 있습니다."><AdminLoginForm /></AuthShell>; }

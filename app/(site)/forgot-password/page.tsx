import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { PasswordResetForm } from "@/features/auth/ui/password-reset-form";

export const metadata: Metadata = { title: "비밀번호 재설정", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <AuthShell eyebrow="고객 계정" title="비밀번호 재설정" description="가입 여부가 노출되지 않도록 모든 이메일에 같은 안내를 표시합니다."><PasswordResetForm /></AuthShell>; }

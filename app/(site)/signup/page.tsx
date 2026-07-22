import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { CustomerSignupForm } from "@/features/auth/ui/customer-signup-form";

export const metadata: Metadata = { title: "회원가입", robots: { index: false, follow: false } };
export default function SignupPage() { return <AuthShell eyebrow="고객 계정" title="회원가입" description="관리자 계정은 이 화면에서 만들 수 없습니다."><CustomerSignupForm /></AuthShell>; }

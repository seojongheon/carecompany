import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/ui/auth-shell";
import { UpdatePasswordForm } from "@/features/auth/ui/update-password-form";

export const metadata: Metadata = { title: "비밀번호 변경", robots: { index: false, follow: false } };

export default function UpdatePasswordPage() {
  return <AuthShell eyebrow="계정 복구" title="새 비밀번호 설정" description="재설정 링크로 확인된 세션에서 새 비밀번호를 입력해 주세요."><UpdatePasswordForm /></AuthShell>;
}

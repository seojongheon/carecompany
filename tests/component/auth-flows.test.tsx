import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/repository/auth-provider";
import { BrowserAuthRepository } from "@/features/auth/repository/browser-auth-repository";
import { CustomerSignupForm } from "@/features/auth/ui/customer-signup-form";
import { AdminLoginForm } from "@/features/auth/ui/admin-login-form";
import { PasswordResetForm } from "@/features/auth/ui/password-reset-form";

describe("authentication flows", () => {
  beforeEach(() => localStorage.clear());

  it("creates a customer account and reports a signed-in session", async () => {
    render(<AuthProvider repository={new BrowserAuthRepository(localStorage)}><CustomerSignupForm /></AuthProvider>);
    await userEvent.type(screen.getByLabelText("이메일"), "customer@example.com");
    await userEvent.type(screen.getByLabelText("비밀번호", { selector: "input" }), "Safe-password-2026");
    await userEvent.type(screen.getByLabelText("비밀번호 확인"), "Safe-password-2026");
    await userEvent.click(screen.getByRole("checkbox", { name: /개인정보처리방침/ }));
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));
    expect(await screen.findByRole("status")).toHaveTextContent("회원가입이 완료되었습니다");
  });

  it("shows no administrator sign-up and never authenticates an administrator", async () => {
    render(<AuthProvider repository={new BrowserAuthRepository(localStorage)}><AdminLoginForm /></AuthProvider>);
    expect(screen.queryByRole("link", { name: /회원가입/ })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("관리자 이메일"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("관리자 비밀번호"), "not-a-real-password");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Supabase 연동 후");
  });

  it("does not reveal whether a password-reset email exists", async () => {
    render(<AuthProvider repository={new BrowserAuthRepository(localStorage)}><PasswordResetForm /></AuthProvider>);
    await userEvent.type(screen.getByLabelText("이메일"), "unknown@example.com");
    await userEvent.click(screen.getByRole("button", { name: "재설정 안내 받기" }));
    expect(await screen.findByRole("status")).toHaveTextContent("계정이 존재하면");
  });

  it("prevents duplicate password-reset submissions while a request is pending", async () => {
    const repository = new BrowserAuthRepository(localStorage);
    let finish!: (value: { ok: true; message: string }) => void;
    const request = vi.spyOn(repository, "requestPasswordReset").mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<AuthProvider repository={repository}><PasswordResetForm /></AuthProvider>);
    await userEvent.type(screen.getByLabelText("이메일"), "customer@example.com");
    await userEvent.click(screen.getByRole("button", { name: "재설정 안내 받기" }));
    expect(screen.getByRole("button", { name: "요청 중..." })).toBeDisabled();
    expect(request).toHaveBeenCalledTimes(1);
    finish({ ok: true, message: "계정이 존재하면 비밀번호 재설정 안내를 보내드립니다." });
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });
});

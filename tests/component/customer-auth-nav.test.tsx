import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AuthRepository, AuthSession } from "@/features/auth/model/types";
import { AuthProvider } from "@/features/auth/repository/auth-provider";
import { CustomerAuthNav } from "@/features/auth/ui/customer-auth-nav";

function repositoryWith(session: AuthSession | null): AuthRepository {
  return {
    getSession: () => session,
    subscribe: () => () => undefined,
    signUpCustomer: async () => ({ ok: false, message: "unused" }),
    signInCustomer: async () => ({ ok: false, message: "unused" }),
    signInAdmin: async () => ({ ok: false, message: "unused" }),
    requestPasswordReset: async () => ({ ok: true, message: "unused" }),
    signOut: () => undefined,
  };
}

function authSession(role: AuthSession["role"]): AuthSession {
  return {
    email: `${role}@example.com`,
    role,
    isActive: true,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

function renderNav(session: AuthSession | null, mobile = false) {
  render(
    <AuthProvider repository={repositoryWith(session)}>
      <CustomerAuthNav mobile={mobile} />
    </AuthProvider>,
  );
}

describe("CustomerAuthNav", () => {
  it("links anonymous visitors to login", () => {
    renderNav(null);
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  });

  it("shows customers a disabled dashboard button without a link", () => {
    renderNav(authSession("customer"));
    expect(screen.queryByRole("link", { name: /대시보드/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /고객 대시보드 준비 중/ })).toBeDisabled();
  });

  it.each(["admin", "super_admin"] as const)("links %s users to the admin dashboard", (role) => {
    renderNav(authSession(role));
    expect(screen.getByRole("link", { name: "대시보드" })).toHaveAttribute("href", "/admin");
  });

  it("keeps the customer dashboard disabled in the mobile variant", () => {
    renderNav(authSession("customer"), true);
    expect(screen.getByRole("button", { name: /고객 대시보드 준비 중/ })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /대시보드/ })).not.toBeInTheDocument();
  });
});

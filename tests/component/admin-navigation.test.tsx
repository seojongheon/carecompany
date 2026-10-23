import type {AnchorHTMLAttributes} from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminAppBar } from "@/components/admin/admin-app-bar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

vi.mock("next/link", () => ({default: ({onClick, ...props}:AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} onClick={event=>{event.preventDefault();onClick?.(event);}}/>}));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/portfolio/example/edit" }));
vi.mock("@/features/auth/repository/auth-provider", () => ({ useAuth: () => ({ signOut: vi.fn() }) }));

describe("admin navigation", () => {
  it("groups role-aware navigation and marks a nested case route current", () => {
    render(<AdminSidebar role="admin" />);
    expect(screen.getByText("위생의 기술")).toBeInTheDocument();
    expect(screen.getByText("콘텐츠")).toBeInTheDocument();
    expect(screen.getByRole("link", {name:"시공 사례"})).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", {name:"회원·권한"})).not.toBeInTheDocument();
    expect(screen.queryByRole("link", {name:"운영 설정"})).not.toBeInTheDocument();
    expect(screen.getByRole("link", {name:"고객 화면 보기"})).toHaveAttribute("href", "/");
  });
  it("closes the mobile drawer after selecting the current menu", async () => {
    render(<AdminAppBar role="super_admin" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", {name:"관리자 메뉴 열기"}));
    const dialog=screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", {name:"회원·권한"})).toBeInTheDocument();
    await user.click(within(dialog).getByRole("link", {name:"시공 사례"}));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

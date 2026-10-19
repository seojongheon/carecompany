import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ path: "/", role: null as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("@/features/auth/repository/auth-provider", () => ({ useOptionalAuth: () => ({ session: state.role ? { role: state.role } : null }) }));
import { AnalyticsConsent } from "@/features/analytics/ui/analytics-consent";
import { ANALYTICS_CONSENT_KEY, ANALYTICS_VISITOR_KEY, ANALYTICS_VISIT_KEY } from "@/features/analytics/model/events";
beforeEach(() => { localStorage.clear(); state.path = "/"; state.role = null; vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true })); });
describe("analytics consent lifecycle", () => {
  it("does not identify or collect before consent", () => { render(<AnalyticsConsent />); expect(fetch).not.toHaveBeenCalled(); expect(localStorage.getItem(ANALYTICS_VISITOR_KEY)).toBeNull(); expect(screen.getByRole("region", { name: "방문 분석 동의" })).toBeVisible(); });
  it("collects after opt-in and clears identifiers on withdrawal", async () => {
    const view = render(<AnalyticsConsent />); fireEvent.click(screen.getByRole("button", { name: "동의" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); expect(localStorage.getItem(ANALYTICS_VISITOR_KEY)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "방문 분석 설정" })); fireEvent.click(screen.getByRole("button", { name: "동의 철회" }));
    expect(localStorage.getItem(ANALYTICS_VISITOR_KEY)).toBeNull(); expect(localStorage.getItem(ANALYTICS_VISIT_KEY)).toBeNull();
    state.path = "/pricing"; view.rerender(<AnalyticsConsent />); await act(async () => {}); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not collect for staff or protected pages", () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "yes"); state.role = "super_admin"; const view = render(<AnalyticsConsent />); expect(fetch).not.toHaveBeenCalled();
    state.role = null; state.path = "/account/inquiries"; view.rerender(<AnalyticsConsent />); expect(fetch).not.toHaveBeenCalled();
  });
});

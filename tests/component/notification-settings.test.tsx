import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationSettings } from "@/features/notifications/ui/notification-settings";

afterEach(() => vi.unstubAllGlobals());
describe("notification recipient changes", () => {
  it("lets operators remove suspended recipients from in-app and external settings", async () => {
    const inactive = "20000000-0000-4000-8000-000000000001";
    const active = "20000000-0000-4000-8000-000000000002";
    const channel = { enabled: false, provider: "none", recipients: [], events: ["inquiry.created"], templateReference: "" };
    const settings = { ...channel, recipients: [inactive], externalChannels: { email: channel, sms: { ...channel, recipients: [inactive] }, kakao: channel } };
    let saved: typeof settings | undefined;
    vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") { saved = JSON.parse(String(init.body)); return { ok: true, json: async () => ({ ok: true }) }; }
      return { ok: true, json: async () => ({ settings, staff: [{ id: active, email: "active@example.test" }], outbox: [] }) };
    });
    render(<NotificationSettings />);
    await screen.findByText("화면 내 알림 이벤트");
    const removed = screen.getAllByRole("checkbox", { name: `비활성 수신자 ${inactive}`, hidden: true });
    expect(removed).toHaveLength(2);
    removed.forEach(input => fireEvent.click(input));
    fireEvent.click(screen.getByRole("button", { name: "알림 설정 저장" }));
    await waitFor(() => expect(saved?.recipients).toEqual([]));
    expect(saved?.externalChannels.sms.recipients).toEqual([]);
    expect(await screen.findByText("운영 알림 설정을 저장했습니다.")).toBeVisible();
  });
});

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

import { SEED_SNAPSHOT } from "@/features/portfolio/data/seed";
import { LocalStoragePortfolioRepository, PORTFOLIO_STORAGE_KEY } from "@/features/portfolio/repository/local-storage-portfolio-repository";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { usePortfolio } from "@/features/portfolio/repository/use-portfolio";

function Probe() {
  const { snapshot, createDraft, mutation, recoveryNotice, resetToSeed } = usePortfolio();
  return (
    <div>
      <output aria-label="case count">{snapshot.cases.length}</output>
      <output aria-label="mutation state">{mutation.state}</output>
      {recoveryNotice ? <p>{recoveryNotice}</p> : null}
      <button
        onClick={() =>
          createDraft({
            serviceId: "service-bathroom",
            title: "Provider 초안",
            slug: `provider-draft-${snapshot.cases.length}`,
            locationDisplay: "천안 서북구",
          })
        }
      >
        초안 만들기
      </button>
      <button onClick={resetToSeed}>초기화</button>
    </div>
  );
}

describe("PortfolioProvider", () => {
  beforeEach(() => localStorage.clear());

  it("starts from a stable seed snapshot and hydrates persisted browser state", async () => {
    const writer = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    writer.createDraft({
      serviceId: "service-aircon",
      title: "저장된 초안",
      slug: "stored-draft",
      locationDisplay: "아산 배방읍",
    });
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);

    expect(renderToString(<PortfolioProvider repository={repository}><Probe /></PortfolioProvider>)).toContain(">20<");
    render(<PortfolioProvider repository={repository}><Probe /></PortfolioProvider>);
    await waitFor(() => expect(screen.getByLabelText("case count")).toHaveTextContent("21"));
  });

  it("updates consumers once after one repository mutation", async () => {
    const user = userEvent.setup();
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><Probe /></PortfolioProvider>);

    await user.click(screen.getByRole("button", { name: "초안 만들기" }));

    expect(screen.getByLabelText("case count")).toHaveTextContent("21");
    expect(screen.getByLabelText("mutation state")).toHaveTextContent("saved");
  });

  it("retains the in-memory input and reports failure when browser storage rejects a save", async () => {
    const user = userEvent.setup();
    const brokenStorage = {
      ...localStorage,
      getItem: localStorage.getItem.bind(localStorage),
      setItem() { throw new DOMException("quota", "QuotaExceededError"); },
      removeItem: localStorage.removeItem.bind(localStorage),
      clear: localStorage.clear.bind(localStorage),
      key: localStorage.key.bind(localStorage),
      get length() { return localStorage.length; },
    } satisfies Storage;
    const repository = new LocalStoragePortfolioRepository(brokenStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><Probe /></PortfolioProvider>);

    await user.click(screen.getByRole("button", { name: "초안 만들기" }));

    expect(screen.getByLabelText("case count")).toHaveTextContent("21");
    expect(screen.getByLabelText("mutation state")).toHaveTextContent("failed");
  });

  it("bridges a recovery notice and can reset changes to seed", async () => {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, "broken");
    const repository = new LocalStoragePortfolioRepository(localStorage, SEED_SNAPSHOT);
    render(<PortfolioProvider repository={repository}><Probe /></PortfolioProvider>);

    await waitFor(() => expect(screen.getByText(/기본 사례로 복구/)).toBeInTheDocument());
    act(() => {
      repository.createDraft({
        serviceId: "service-bathroom",
        title: "초기화할 초안",
        slug: "reset-me",
        locationDisplay: "천안 동남구",
      });
    });
    expect(screen.getByLabelText("case count")).toHaveTextContent("21");

    await userEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(screen.getByLabelText("case count")).toHaveTextContent("20");
  });
});

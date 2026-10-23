import { describe, expect, it } from "vitest";
import { getDocumentDefaults, validateDocument, compareDocument, mayEditDocument } from "@/features/site-content/model/documents";

describe("independent content documents", () => {
  it("rejects unknown service keys and prevents changing canonical URLs", () => {
    expect(validateDocument("service:unknown", {}).ok).toBe(false);
    expect(validateDocument("service:bathroom", { ...getDocumentDefaults("service:bathroom"), key: "aircon" }).ok).toBe(false);
  });
  it("supports multiple prices per canonical service with valid ranges", () => {
    const value = getDocumentDefaults("pricing") as { lead: string; items: Record<string, unknown>[] };
    const first = value.items[0];
    expect(validateDocument("pricing", { ...value, items: [first, { ...first, id: "second" }] }).ok).toBe(true);
    expect(validateDocument("pricing", { ...value, items: [{ ...first, minPrice: 200, maxPrice: 100 }] }).ok).toBe(false);
  });
  it("requires an explicit policy review before publishing", () => {
    const policy = getDocumentDefaults("policy");
    expect(validateDocument("policy", policy, false).ok).toBe(true);
    expect(validateDocument("policy", policy, true).ok).toBe(false);
    expect(mayEditDocument("policy", "admin")).toBe(false);
    expect(mayEditDocument("settings", "admin")).toBe(false);
    expect(mayEditDocument("home", "admin")).toBe(true);
  });
  it("rejects unsafe CTA links and blank image alternatives", () => {
    const home = getDocumentDefaults("home");
    expect(validateDocument("home", { ...home, primaryCtaHref: "//evil.example" }).ok).toBe(false);
    expect(validateDocument("home", { ...home, image: { path: "site/a.webp", alt: "", focalX: 50, focalY: 50 } }).ok).toBe(false);
  });
  it("compares only changed field paths without mutating snapshots", () => {
    expect(compareDocument({ title: "live", nested: { count: 1 } }, { title: "draft", nested: { count: 1 } })).toEqual([{ path: "title", before: "live", after: "draft" }]);
  });
});

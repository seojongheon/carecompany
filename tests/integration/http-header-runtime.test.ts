import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";

const nextCommand = "node --max-http-header-size=65536 node_modules/next/dist/bin/next";

describe("Next.js HTTP header runtime", () => {
  it("starts development with a bounded 64 KiB request-header allowance", () => {
    expect(packageJson.scripts.dev).toBe(`${nextCommand} dev`);
  });

  it("starts self-hosted production with the same request-header allowance", () => {
    expect(packageJson.scripts.start).toBe(`${nextCommand} start`);
  });
});

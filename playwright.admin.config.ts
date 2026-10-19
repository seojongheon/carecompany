import { defineConfig } from "@playwright/test";

// This config never starts an app with .env credentials. Point it at an explicitly
// prepared staging or explicitly authorized linked deployment whose browser
// Supabase URL matches E2E_SUPABASE_URL.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["admin-drafts.spec.ts", "admin-publishing.spec.ts", "admin-operations.spec.ts"],
  outputDir: "test-results/admin-staging",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report/admin-staging", open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3310",
    // Sign-in requests carry test passwords; never persist traces or videos.
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "admin-staging-desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "admin-staging-mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});

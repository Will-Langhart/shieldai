import { defineConfig } from "@playwright/test";

// Preview suite: browser specs against a deployed Vercel preview (every flag
// on), a local production build (preview-local.mjs) or production (flag-watch).
// PLAYWRIGHT_BASE_URL picks the target; VERCEL_AUTOMATION_BYPASS_SECRET gets
// past Vercel's login wall on previews. ADAPT: if the repo already has a
// Playwright config, add the baseURL and bypass headers to it instead.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL;
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: BASE_URL ? [] : ["preview/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: BYPASS
      ? { "x-vercel-protection-bypass": BYPASS, "x-vercel-set-bypass-cookie": "true" }
      : undefined,
    trace: "on-first-retry",
  },
});

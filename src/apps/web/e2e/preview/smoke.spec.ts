import { expect, test } from "@playwright/test";

// Runs against a preview, a local build or production (see playwright.config.ts).
// Feature specs live next to it as `<flag-key>-<what>.spec.ts`.

test("home page renders without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto("/");
  expect(res?.ok()).toBe(true);
  await expect(page).toHaveTitle(/Shield AI/);
  expect(errors).toEqual([]);
});

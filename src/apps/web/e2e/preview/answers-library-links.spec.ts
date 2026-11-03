import { expect, test } from "@playwright/test";

// answers-library: the home page links to /answers from the footer and the
// page body, the library lists 24+ topics across all 10 categories, and a new
// topic page offers a chat follow-up. Runs with the flag on (previews).

test("home links to /answers and the library is complete", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const home = await page.goto("/");
  expect(home?.ok()).toBe(true);

  await expect(page.locator('footer a[href="/answers"]')).toHaveCount(1);
  await expect(
    page.locator('a[href="/answers"]', { hasText: "Browse answers to hard questions" }),
  ).toHaveCount(1);

  const index = await page.goto("/answers");
  expect(index?.ok()).toBe(true);
  expect(await page.locator('main a[href^="/answers/"]').count()).toBeGreaterThanOrEqual(24);
  expect(await page.locator("main h2").count()).toBeGreaterThanOrEqual(10);

  const topic = await page.goto("/answers/is-hell-fair");
  expect(topic?.ok()).toBe(true);
  const ask = page.getByRole("link", { name: "Ask Shield AI about this" });
  await expect(ask).toBeVisible();
  expect(await ask.getAttribute("href")).toMatch(/^\/chat\?q=/);

  expect(errors).toEqual([]);
});

import { expect, test } from "@playwright/test";

// answers-library: the library has 16+ topics, including the "Other religions"
// and "Christian living" categories, and the Trinity topic page renders.
// Runs with the flag on (previews).

test("/answers lists the added topics and categories", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await page.goto("/answers");
  expect(res?.ok()).toBe(true);

  const links = page.locator('main a[href^="/answers/"]');
  expect(await links.count()).toBeGreaterThanOrEqual(16);

  await expect(page.getByRole("heading", { level: 2, name: "Other religions" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Christian living" })).toBeVisible();

  const topic = await page.goto("/answers/what-is-the-trinity");
  expect(topic?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Trinity");

  expect(errors).toEqual([]);
});

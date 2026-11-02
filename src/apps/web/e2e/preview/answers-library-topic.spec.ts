import { expect, test } from "@playwright/test";

// answers-library: each /answers/<slug> topic page is public (no sign-in),
// shows the question, an "Ask Shield AI" link into chat and FAQPage JSON-LD.
// Runs with the flag on (previews).

test("an /answers topic page renders from the index", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await page.goto("/answers");
  expect(res?.ok()).toBe(true);

  const first = page.locator('main a[href^="/answers/"]').first();
  const linkText = (await first.innerText()).trim();
  expect(linkText).not.toBe("");
  await first.click();

  await expect(page).toHaveURL(/\/answers\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(linkText);

  const ask = page.getByRole("link", { name: "Ask Shield AI about this" });
  await expect(ask).toBeVisible();
  expect(await ask.getAttribute("href")).toMatch(/^\/chat\?q=/);

  const ldTexts = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ldTexts.some((t) => t.includes("FAQPage"))).toBe(true);

  expect(errors).toEqual([]);
});

test("an unknown /answers topic returns 404", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await page.goto("/answers/not-a-real-topic");
  expect(res?.status()).toBe(404);

  expect(errors).toEqual([]);
});

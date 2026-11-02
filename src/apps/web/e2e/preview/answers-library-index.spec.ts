import { expect, test } from "@playwright/test";

// answers-library: /answers is public (no sign-in) and lists the hard
// questions with a keyword filter. Runs with the flag on (previews).

test("/answers lists the answers and filters them", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await page.goto("/answers");
  expect(res?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1, name: "Answers" })).toBeVisible();

  const links = page.locator('main a[href^="/answers/"]');
  expect(await links.count()).toBeGreaterThanOrEqual(8);

  const filter = page.getByLabel("Filter answers");
  await expect(filter).toBeVisible();
  await filter.fill("zzqxnonsenseword");
  await expect(page.getByText(/No answers match/)).toBeVisible();
  await expect(links).toHaveCount(0);

  await filter.fill("");
  await expect.poll(() => links.count()).toBeGreaterThanOrEqual(8);

  expect(errors).toEqual([]);
});

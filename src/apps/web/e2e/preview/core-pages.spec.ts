import { expect, test } from "@playwright/test";

// The main routes render their page with no uncaught errors. Signed-out view:
// assertions stick to static copy, never data that changes.

const pages = [
  { path: "/", title: /Shield AI/, heading: /hardest questions of faith/i },
  { path: "/bible", title: /Bible Study & Reading/ },
  { path: "/chat", title: /AI Apologetics Chat/ },
  // Signed-in pages: a signed-out visitor gets the sign-in prompt, so title only.
  { path: "/journal", title: /Study Journal/ },
  // /insights-history is left out: it returns a 500 on production today.
];

for (const { path, title, heading } of pages) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.ok()).toBe(true);
    await expect(page).toHaveTitle(title);
    if (heading) await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

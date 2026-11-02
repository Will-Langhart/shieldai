import { expect, test } from "@playwright/test";

// not-found-page: an unknown path returns 404 and, with every flag on, shows
// the branded page with links back to Home, Bible and Chat. Signed-out view.

test("unknown path shows the branded 404 with helpful links", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await page.goto("/this-page-does-not-exist-xyz");
  expect(res?.status()).toBe(404);

  await expect(page.getByRole("heading", { level: 1, name: /page not found/i })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Helpful links" });
  const links = [
    { label: /^Home/, href: "/" },
    { label: /^Bible/, href: "/bible" },
    { label: /^Chat/, href: "/chat" },
  ];
  for (const { label, href } of links) {
    const link = nav.getByRole("link", { name: label });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }

  await nav.getByRole("link", { name: /^Bible/ }).click();
  await expect(page).toHaveURL(/\/bible$/);
  await expect(page).toHaveTitle(/Bible Study & Reading/);

  expect(errors).toEqual([]);
});

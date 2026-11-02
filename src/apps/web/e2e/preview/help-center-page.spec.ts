import { expect, test } from "@playwright/test";

// help-center: /help is public (no sign-in) and explains chat modes, the Bible
// reader and notes. The footer's "Help Center" link lands on it. Runs with the
// flag on (previews).

test("/help shows the Help Center", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await page.goto("/help");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Help Center/);
  await expect(page.getByRole("heading", { level: 1, name: "Help Center" })).toBeVisible();

  const main = page.locator("main");
  await expect(main.getByRole("heading", { level: 2, name: "Chat modes", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { level: 2, name: "Reading the Bible", exact: true })).toBeVisible();
  for (const mode of ["gentle", "scholarly", "debate"]) {
    await expect(main.getByText(new RegExp(`\\b${mode}\\b`, "i")).first()).toBeVisible();
  }

  await expect(main.getByRole("link", { name: "Ask a question in chat" })).toHaveAttribute("href", "/chat");

  expect(errors).toEqual([]);
});

test("the footer's Help Center link opens /help", async ({ page }) => {
  await page.goto("/");
  await page.locator("footer").getByRole("link", { name: "Help Center", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/help");
  await expect(page.getByRole("heading", { level: 1, name: "Help Center" })).toBeVisible();
});

import { expect, test } from "@playwright/test";

// The home page's links to the main routes work for a signed-out visitor.
// (The header nav only shows once signed in, so these use the footer.)

const links = [
  { name: "Bible Study", path: "/bible", title: /Bible Study & Reading/ },
  { name: "AI Chat", path: "/chat", title: /AI Apologetics Chat/ },
];

for (const { name, path, title } of links) {
  test(`home footer link "${name}" goes to ${path}`, async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === path);
    await expect(page).toHaveTitle(title);
  });
}

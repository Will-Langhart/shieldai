import { expect, test } from "@playwright/test";

// pricing-page: /pricing shows the four plans, the billing toggle switches
// prices to yearly, and choosing a plan opens the sign-up dialog. Signed-out view.

test("pricing page lists the plans and toggles monthly/yearly", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await page.goto("/pricing");
  expect(res?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "Plans" })).toBeVisible();
  for (const name of ["Explorer", "Bible Student", "Bible Scholar", "Ministry"]) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  }

  const toggle = page.getByRole("radiogroup", { name: "Billing period" });
  await expect(toggle.getByRole("radio", { name: "Monthly" })).toHaveAttribute("aria-checked", "true");

  const studentPrice = page.getByRole("article", { name: "Bible Student" }).getByTestId("plan-price");
  const monthlyText = (await studentPrice.textContent()) ?? "";
  expect(monthlyText).toContain("/month");

  await toggle.getByRole("radio", { name: "Yearly" }).click();
  await expect(toggle.getByRole("radio", { name: "Yearly" })).toHaveAttribute("aria-checked", "true");
  await expect(studentPrice).not.toHaveText(monthlyText);
  await expect(studentPrice).toContainText("/year");

  await page.getByRole("button", { name: "Choose Bible Scholar" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /sign up/i })).toBeVisible();

  expect(errors).toEqual([]);
});

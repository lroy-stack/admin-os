import { expect, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The showcase screens that run on demo-local state (plan 003, P4 to P9): one journey per screen, in the `en`
 * dictionary. Each window says the data is the demo's, and the page under it never moves.
 */

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
});

test.describe("showcase screens", () => {
  let problems: string[] = [];

  test.beforeEach(({ page }) => {
    problems = watch(page);
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("finance: the quick transfer is reviewed and confirmed without moving money", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await page.getByLabel("Amount").fill("120");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Review transfer" });
    await expect(dialog.getByText("Demo data, not saved")).toBeVisible();
    await dialog.getByRole("button", { name: "Confirm transfer" }).click();

    await expect(page.getByRole("dialog", { name: "Transfer reviewed" })).toContainText("No money moved");
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("finance: Export downloads the transactions as CSV", async ({ page }) => {
    await page.goto("/dashboard/finance");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export" }).click();
    expect((await download).suggestedFilename()).toBe("finance-transactions.csv");
  });

  test("ecommerce: an order opens its panel from the row menu", async ({ page }) => {
    await page.goto("/dashboard/ecommerce");
    await page.getByRole("button", { name: "Open order actions" }).first().click();
    await page.getByRole("menuitem", { name: "View order" }).click();
    await expect(page.getByRole("dialog", { name: "Order #14550" })).toBeVisible();
  });

  test("infrastructure: the search narrows the projects", async ({ page }) => {
    await page.goto("/dashboard/infrastructure");
    await expect(page.getByText("(Admin Console)")).toBeVisible();
    await page.getByLabel("Search environments").fill("reports");
    await expect(page.getByText("(Admin Console)")).toBeHidden();
    await expect(page.getByText("next-shadcn-admin-dashboard.vercel.app/reports")).toBeVisible();
  });

  test("productivity: a new note joins the recent notes", async ({ page }) => {
    await page.goto("/dashboard/productivity");
    await page.getByRole("button", { name: "New note" }).click();
    const dialog = page.getByRole("dialog", { name: "New note" });
    await expect(dialog.getByText("Demo data, not saved")).toBeVisible();
    await dialog.getByLabel("Title").fill("Ideas for the autumn menu");
    await dialog.getByRole("button", { name: "New note" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Ideas for the autumn menu")).toBeVisible();
  });

  test("logistics: a search no shipment matches says so", async ({ page }) => {
    await page.goto("/dashboard/logistics");
    await page.getByLabel("Search shipments").fill("zzzz-no-match");
    await expect(page.getByText("No shipments match your filters.")).toBeVisible();
  });

  test("patient monitoring: Silence mutes the alarm audio icon", async ({ page }) => {
    await page.goto("/dashboard/patient-monitoring");
    await page.getByRole("button", { name: "Silence", exact: true }).click();
    await expect(page.getByRole("button", { name: "Silence", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Alarm audio silenced" })).toBeVisible();
  });

  test("the template sign-in pages no longer offer Continue with Google", async ({ page }) => {
    await page.goto("/auth/v1/login");
    await expect(page.getByRole("button", { name: /Google/ })).toHaveCount(0);
    await page.goto("/auth/v2/login");
    await expect(page.getByRole("button", { name: /Google/ })).toHaveCount(0);
  });
});

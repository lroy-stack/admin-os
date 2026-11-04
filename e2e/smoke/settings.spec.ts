import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The business settings (spec 008): the hospitality preset's demo company, the owner's Edit window that saves into the
 * visitor's demo session, and the read-only view of the other roles. The wording is the `en` dictionary and the data
 * the seeded preset, so nothing depends on the clock or on chance.
 */

const windowOf = (page: Page) => page.getByRole("dialog", { name: "Edit business details" });
// By CSS, not by role: an open modal hides the page from the accessibility tree, and the geometry test reads it then.
const sectionOf = (page: Page, title: string) => page.locator('main [data-slot="card"]', { hasText: title });

test.describe("business settings", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("show the preset's demo company (AC6)", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(sectionOf(page, "Business")).toContainText("Lumbre Bistro");
    await expect(sectionOf(page, "Business")).toContainText("B00000017");
    await expect(sectionOf(page, "Invoicing")).toContainText("15 days");
    await expect(sectionOf(page, "Invoicing")).toContainText("10%");
  });

  test("open from the account menu", async ({ page }) => {
    await page.goto("/dashboard/customers");
    await page.getByRole("button", { name: /Account: / }).click();
    await page.getByRole("menuitem", { name: "Business settings" }).click();

    await expect(page).toHaveURL(/\/dashboard\/settings$/);
  });

  test("the owner's change is saved, announced and shown (AC6)", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.getByRole("button", { name: "Edit" }).click();
    await windowOf(page).getByRole("textbox", { name: "Trade name" }).fill("Lumbre Bistro & Bar");
    await windowOf(page).getByRole("textbox", { name: "Payment terms (days)" }).fill("30");
    await windowOf(page).getByRole("button", { name: "Save" }).click();

    await expect(windowOf(page)).toBeHidden();
    await expect(page.locator("[data-sonner-toast]").first()).toContainText("Business details saved.");
    await expect(sectionOf(page, "Business")).toContainText("Lumbre Bistro & Bar");
    await expect(sectionOf(page, "Invoicing")).toContainText("30 days");
    await expect(page.getByRole("button", { name: "Edit" })).toBeFocused();
  });

  test("an email that is not one keeps the window open, with the field's error", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.getByRole("button", { name: "Edit" }).click();
    await windowOf(page).getByRole("textbox", { name: "Billing email" }).fill("billing");
    await windowOf(page).getByRole("button", { name: "Save" }).click();

    await expect(windowOf(page).getByText("Enter an email address, or leave it empty.")).toBeVisible();
    await expect(windowOf(page).getByRole("textbox", { name: "Billing email" })).toBeFocused();
  });

  test("the window opens above the page without moving it (ADR 0015)", async ({ page }) => {
    await page.goto("/dashboard/settings");
    const before = await sectionOf(page, "Payment details").boundingBox();

    await page.getByRole("button", { name: "Edit" }).click();
    await expect(windowOf(page)).toBeVisible();

    expect(await sectionOf(page, "Payment details").boundingBox()).toEqual(before);
  });

  test("staff read the details and get no Edit (AC6)", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "demo_role", value: "staff", url: baseURL }]);
    await page.goto("/dashboard/settings");

    await expect(sectionOf(page, "Business")).toContainText("Lumbre Bistro");
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    await expect(page.getByText("Only the owner can change these details.")).toBeVisible();
  });
});

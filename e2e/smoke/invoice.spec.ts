import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The invoice starts from the business settings, the session's customers and its catalog (spec 008): the hospitality
 * preset's company issues it, its first customer is billed, its first catalog items are the lines, and a change the
 * owner saves in Settings is on the next invoice. The wording is the `en` dictionary and the data the seeded preset.
 */

// The preview and the copy kept for printing are the same paper; the first is the one on screen.
const paperOf = (page: Page) => page.locator("[data-print-paper]").first();

test.describe("invoice from the business settings", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ context, baseURL, page }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "currency", value: "EUR", url: baseURL },
    ]);
    problems = watch(page);
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("is issued by the preset's company, with its tax and terms (AC7)", async ({ page }) => {
    await page.goto("/dashboard/invoice");

    await expect(paperOf(page)).toContainText("Lumbre Hostelería S.L.");
    await expect(paperOf(page)).toContainText("Tax ID: B00000017");
    await expect(paperOf(page)).toContainText("Account no.: ES00 0000 0000 0000 0000 0101");
    await expect(paperOf(page)).toContainText("VAT 10%");
    await expect(paperOf(page)).toContainText("Payment due: Nov 15, 2026");
  });

  test("bills a customer of the session and starts with its catalog items (AC8)", async ({ page }) => {
    await page.goto("/dashboard/invoice");

    await expect(paperOf(page)).toContainText("Iglesias");
    await expect(paperOf(page)).toContainText("Ham croquettes");
  });

  test("links to the business details it prints", async ({ page }) => {
    await page.goto("/dashboard/invoice");
    await page.getByRole("link", { name: "Business details" }).click();

    await expect(page).toHaveURL(/\/dashboard\/settings$/);
  });

  test("follows what the owner saves in Settings, without a deploy (AC7)", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.getByRole("button", { name: "Edit" }).click();
    const window = page.getByRole("dialog", { name: "Edit business details" });
    await window.getByRole("textbox", { name: "Legal name" }).fill("Lumbre Grupo S.L.");
    await window.getByRole("textbox", { name: "VAT rate (%)" }).fill("21");
    await window.getByRole("textbox", { name: "Payment terms (days)" }).fill("30");
    await window.getByRole("button", { name: "Save" }).click();
    await expect(window).toBeHidden();

    await page.goto("/dashboard/invoice");

    await expect(paperOf(page)).toContainText("Lumbre Grupo S.L.");
    await expect(paperOf(page)).toContainText("VAT 21%");
    await expect(paperOf(page)).toContainText("Payment due: Nov 30, 2026");
  });
});

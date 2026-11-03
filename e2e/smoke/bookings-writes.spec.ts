import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * Status, cancel and no-show through the data seam (plan 003, B3, AC5): a step shows at once and can be taken back,
 * cancel and no-show ask first (cancel needs a reason), and a role without the permission does not see them. Every
 * test starts a demo session of its own, on the seeded day ("now" is 8:40 PM, Saturday Oct 31).
 */

const view = (page: Page, name: "Floor" | "Agenda" | "List") =>
  page.getByRole("radiogroup", { name: "Reservations view" }).getByRole("radio", { name });

const undoOf = (page: Page, message: string) =>
  page.locator("[data-sonner-toast]").filter({ hasText: message }).getByRole("button", { name: "Undo" });

const openDetails = async (page: Page, guest: string) => {
  await view(page, "List").click();
  await page.getByRole("button", { name: guest, exact: true }).click();
  return page.getByRole("dialog", { name: guest });
};

test.describe("bookings writes", () => {
  test.describe.configure({ timeout: 90_000 });

  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/bookings");
    await expect(page.getByRole("button", { name: /^S3, \d+ seats/ })).toBeVisible({ timeout: 30_000 });
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("confirm, seat and complete each show at once, and Undo takes the last step back", async ({ page }) => {
    await view(page, "List").click();
    const row = page.getByRole("row", { name: /Marín/ });

    await row.getByRole("button", { name: "Confirm" }).click();
    await expect(row.getByRole("cell", { name: "Confirmed" })).toBeVisible();

    await row.getByRole("button", { name: "Seat at S4" }).click();
    await expect(row.getByRole("cell", { name: "Seated" })).toBeVisible();

    await row.getByRole("button", { name: "Complete" }).click();
    await expect(row).toHaveCount(0);

    await undoOf(page, "Marín completed").click();
    await expect(row.getByRole("cell", { name: "Seated" })).toBeVisible();
  });

  test("a step survives a reload, because it was written", async ({ page }) => {
    await view(page, "List").click();
    const row = page.getByRole("row", { name: /Marín/ });
    await row.getByRole("button", { name: "Confirm" }).click();
    await expect(row.getByRole("cell", { name: "Confirmed" })).toBeVisible();
    await expect(row.getByRole("button", { name: "Seat at S4" })).toBeEnabled();

    await page.reload();
    await view(page, "List").click();

    await expect(page.getByRole("row", { name: /Marín/ }).getByRole("cell", { name: "Confirmed" })).toBeVisible();
  });

  test("cancel asks first, needs a reason and frees the table", async ({ page }) => {
    const details = await openDetails(page, "Castaño");
    await details.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Cancel reservation" }).click();

    const confirm = page.getByRole("alertdialog");
    const cancel = confirm.getByRole("button", { name: "Cancel reservation" });
    await expect(cancel).toBeDisabled();
    await expect(confirm.getByRole("button", { name: "Keep reservation" })).toBeFocused();

    await confirm.getByLabel("Why is it cancelled?").fill("Guest called to cancel");
    await cancel.click();

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(details.getByText("Cancelled", { exact: true })).toBeVisible();
    await expect(details.getByText("No table yet")).toBeVisible();

    await page.keyboard.press("Escape");
    await view(page, "Floor").click();
    await page.getByRole("radio", { name: /^Rooftop/ }).click();
    await expect(page.getByRole("button", { name: /^T8, \d+ seats, Free/ })).toBeVisible();
  });

  test("keeping the reservation leaves it as it was", async ({ page }) => {
    const details = await openDetails(page, "Castaño");
    await details.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Cancel reservation" }).click();

    await page.getByRole("alertdialog").getByRole("button", { name: "Keep reservation" }).click();

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(details.getByText("Confirmed", { exact: true })).toBeVisible();
  });

  test("a no-show asks first and the reason is optional", async ({ page }) => {
    const details = await openDetails(page, "Bravo");
    await details.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Mark no-show" }).click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByLabel("Reason (optional)")).toBeVisible();
    await confirm.getByRole("button", { name: "Mark no-show" }).click();

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(details.getByText("No-show", { exact: true })).toBeVisible();
  });

  test("a party that is not late yet cannot be marked as a no-show", async ({ page }) => {
    const details = await openDetails(page, "Ortega");

    await expect(details.getByRole("button", { name: "More actions" })).toHaveCount(0);
  });
});

test.describe("bookings writes as staff", () => {
  test.describe.configure({ timeout: 90_000 });

  test("staff can step a reservation but sees neither Cancel nor No-show", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_role", value: "staff", url: baseURL },
    ]);
    const problems = watch(page);
    await page.goto("/dashboard/bookings");
    await expect(page.getByRole("button", { name: /^S3, \d+ seats/ })).toBeVisible({ timeout: 30_000 });

    const details = await openDetails(page, "Bravo");

    await expect(details.getByRole("button", { name: "Seat at S5" })).toBeVisible();
    await expect(details.getByRole("button", { name: "More actions" })).toHaveCount(0);
    expect(problems).toEqual([]);
  });
});

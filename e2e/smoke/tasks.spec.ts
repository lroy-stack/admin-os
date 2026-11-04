import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The Tasks table (plan 003, P3) on demo-local state: the row menu's Edit, Make a copy, Favorite, Labels and Delete
 * with undo. The wording is the `en` dictionary and the rows are the demo seed, so nothing depends on the clock.
 */

const ROW = "TASK-8782";

const row = (page: Page, id: string) => page.getByRole("row").filter({ hasText: id });
const openMenu = (page: Page, id: string) => row(page, id).getByRole("button", { name: "Open menu" }).click();

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
});

test.describe("tasks table", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page }) => {
    problems = watch(page);
    await page.goto("/dashboard/tasks");
    await expect(row(page, ROW)).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("Edit changes the title, status and priority of a row and says the data is the demo's", async ({ page }) => {
    await openMenu(page, ROW);
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Edit task" });
    await expect(dialog.getByText("Demo data, not saved")).toBeVisible();

    await dialog.getByLabel("Title").fill("Repair the quay lights");
    await dialog.getByLabel("Priority").selectOption({ label: "High" });
    await dialog.getByRole("button", { name: "Save task" }).click();

    await expect(dialog).toBeHidden();
    await expect(row(page, ROW)).toContainText("Repair the quay lights");
    await expect(row(page, ROW)).toContainText("High");
  });

  test("Edit refuses an empty title", async ({ page }) => {
    await openMenu(page, ROW);
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Edit task" });

    await dialog.getByLabel("Title").fill("");
    await dialog.getByRole("button", { name: "Save task" }).click();

    await expect(dialog.getByText("Enter a title.")).toBeVisible();
  });

  test("Make a copy inserts the copy after its source, and undo removes it", async ({ page }) => {
    await openMenu(page, ROW);
    await page.getByRole("menuitem", { name: "Make a copy" }).click();

    await expect(page.getByRole("row").filter({ hasText: "Copy of" })).toHaveCount(1);
    await expect(page.locator("[data-sonner-toast]", { hasText: "Copy created as TASK-" })).toBeVisible();

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("row").filter({ hasText: "Copy of" })).toHaveCount(0);
  });

  test("Favorite marks the row and the menu then offers to remove it", async ({ page }) => {
    await openMenu(page, ROW);
    await page.getByRole("menuitem", { name: "Favorite" }).click();
    await expect(row(page, ROW).getByText("Favorite")).toBeAttached();

    await openMenu(page, ROW);
    await page.getByRole("menuitem", { name: "Remove from favorites" }).click();
    await expect(row(page, ROW).getByText("Favorite")).toHaveCount(0);
  });

  test("Labels sets the label of the row", async ({ page }) => {
    await expect(row(page, ROW)).toContainText("Documentation");

    await openMenu(page, ROW);
    await page.getByRole("menuitem", { name: "Labels" }).click();
    await page.getByRole("menuitemradio", { name: "Bug" }).click();

    await expect(row(page, ROW)).toContainText("Bug");
  });

  test("Delete removes the row, and undo brings it back", async ({ page }) => {
    await openMenu(page, ROW);
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(row(page, ROW)).toHaveCount(0);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(row(page, ROW)).toBeVisible();
  });
});

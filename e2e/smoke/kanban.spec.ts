import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The Projects board (plan 003, P2) on demo-local state: Add task, the card's record and menu, moving a card, search,
 * filter and sort, and the column menu. The wording is the `en` dictionary and the data is the demo seed, so nothing
 * depends on the clock.
 */

const TASK = "Quay lighting plan";
const SEED = "Tender workflow map";

const column = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const card = (page: Page, columnName: string, title: string) =>
  column(page, columnName).getByRole("heading", { level: 3, name: title });

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
});

test.describe("kanban board", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page }) => {
    problems = watch(page);
    await page.goto("/dashboard/kanban");
    await expect(card(page, "Ideas", SEED)).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("Add task creates a task in the chosen column and says the data is the demo's", async ({ page }) => {
    await page.getByRole("main").getByRole("button", { name: "Add task", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "New task" });
    await expect(dialog.getByText("Demo data, not saved")).toBeVisible();

    await dialog.getByLabel("Title").fill(TASK);
    await dialog.getByLabel("Status").selectOption({ label: "Planned" });
    await dialog.getByLabel("Owner").selectOption({ label: "Alex Morgan" });
    await dialog.getByLabel("Due date").fill("2026-07-01");
    await dialog.getByRole("button", { name: "Create task" }).click();

    await expect(dialog).toBeHidden();
    await expect(card(page, "Planned", TASK)).toBeVisible();
  });

  test("an empty New task form names what is missing and keeps the window open", async ({ page }) => {
    await page.getByRole("main").getByRole("button", { name: "Add task", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "New task" });

    await dialog.getByRole("button", { name: "Create task" }).click();

    await expect(dialog.getByText("Enter a title.")).toBeVisible();
    await expect(dialog.getByText("Select an owner.")).toBeVisible();
    await expect(dialog.getByText("Enter a valid due date.")).toBeVisible();
  });

  test("the + of a column opens New task with that column preset", async ({ page }) => {
    await page.getByRole("button", { name: "Add task to QA" }).click();

    await expect(page.getByRole("dialog", { name: "New task" }).getByLabel("Status")).toHaveValue("qa");
  });

  test("a card moves to another column from its menu, and undo puts it back", async ({ page }) => {
    await page.getByRole("button", { name: `More actions for ${SEED}` }).click();
    await page.getByRole("menuitem", { name: "Move to" }).click();
    await page.getByRole("menuitem", { name: "Planned" }).click();

    await expect(card(page, "Planned", SEED)).toBeVisible();
    await expect(card(page, "Ideas", SEED)).toHaveCount(0);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(card(page, "Ideas", SEED)).toBeVisible();
  });

  test("a card moves to another column by drag, and a toast offers undo", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "375",
      "the columns scroll sideways on a phone; the menu path is checked there",
    );
    const source = await card(page, "Ideas", SEED).boundingBox();
    const target = await column(page, "Planned").boundingBox();
    if (!source || !target) throw new Error("the board did not lay out");

    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(target.x + target.width / 2, target.y + 120, { steps: 20 });
    await page.mouse.up();

    await expect(card(page, "Planned", SEED)).toBeVisible();
    await expect(page.locator("[data-sonner-toast]", { hasText: `${SEED} moved to Planned` })).toBeVisible();
  });

  test("a card opens its record, where Move to changes the status", async ({ page }) => {
    await card(page, "Ideas", SEED).click();
    const panel = page.getByRole("dialog", { name: SEED });
    await expect(panel.getByText("Task in Ideas")).toBeVisible();

    await panel.getByLabel("Move to").selectOption({ label: "QA" });

    await expect(panel.getByText("Task in QA")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(card(page, "QA", SEED)).toBeVisible();
  });

  test("Edit changes the task and Delete asks first, then offers undo", async ({ page }) => {
    await page.getByRole("button", { name: `More actions for ${SEED}` }).click();
    await page.getByRole("menuitem", { name: "Edit task" }).click();
    const form = page.getByRole("dialog", { name: "Edit task" });
    await form.getByLabel("Title").fill("Tender map, revised");
    await form.getByRole("button", { name: "Save task" }).click();
    await expect(card(page, "Ideas", "Tender map, revised")).toBeVisible();

    await page.getByRole("button", { name: "More actions for Tender map, revised" }).click();
    await page.getByRole("menuitem", { name: "Delete task" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete task" }).click();
    await expect(card(page, "Ideas", "Tender map, revised")).toHaveCount(0);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(card(page, "Ideas", "Tender map, revised")).toBeVisible();
  });

  test("search, filter and sort narrow the board", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search tasks" }).fill("payslip");
    await expect(card(page, "QA", "Payslip preview")).toBeVisible();
    await expect(card(page, "Ideas", SEED)).toHaveCount(0);
    await page.getByRole("textbox", { name: "Search tasks" }).fill("");

    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.getByLabel("Priority").selectOption({ label: "Low" });
    await page.keyboard.press("Escape");
    await expect(card(page, "Ideas", "Future sync notes")).toBeVisible();
    await expect(card(page, "Ideas", SEED)).toHaveCount(0);

    await page.getByRole("button", { name: "Filter (1)" }).click();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Sort", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Title" }).click();
    await expect(column(page, "Ideas").getByRole("heading", { level: 3 }).first()).toHaveText(
      "Backup and restore plan",
    );
  });

  test("the column menu renames a column and deletes it with undo", async ({ page }) => {
    await page.getByRole("button", { name: "QA column actions" }).click();
    await page.getByRole("menuitem", { name: "Rename column" }).click();
    const dialog = page.getByRole("dialog", { name: "Rename column" });
    await dialog.getByLabel("Column name").fill("Review");
    await dialog.getByRole("button", { name: "Rename column" }).click();
    await expect(column(page, "Review")).toBeVisible();

    await page.getByRole("button", { name: "Review column actions" }).click();
    await page.getByRole("menuitem", { name: "Delete column" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete column" }).click();
    await expect(column(page, "Review")).toHaveCount(0);

    await page
      .locator("[data-sonner-toast]", { hasText: "Review deleted" })
      .getByRole("button", { name: "Undo" })
      .click();
    await expect(column(page, "Review")).toBeVisible();
  });
});

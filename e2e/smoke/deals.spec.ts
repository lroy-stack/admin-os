import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";
import { readFile } from "node:fs/promises";

/**
 * The deal windows (plan 003, P1 and R1) on demo-local state: New deal from the header and from a column's +, the
 * deal menu (edit, move, delete with undo), the deal panel, the CSV export, and the same cards on Home. The wording is
 * the `en` dictionary and the data is the CRM mock, so nothing depends on the clock.
 */

// The only deal with this title in the mock (several share "Solar carport canopy").
const DEAL = "Rooftop array, 90 kW";
const DEAL_COMPANY = "Cedar Park Council";

const stage = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const dealIn = (page: Page, column: string, title: string) =>
  stage(page, column).getByRole("heading", { level: 3, name: title });
const menuOf = (page: Page, title: string) => page.getByRole("button", { name: `More actions for ${title}` });

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
});

test.describe("deal pipeline", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page }) => {
    problems = watch(page);
    await page.goto("/dashboard/crm");
    await expect(dealIn(page, "Qualification", DEAL)).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("New deal creates a deal in the chosen stage and says the data is the demo's", async ({ page }) => {
    await page.getByRole("main").getByRole("button", { name: "New deal" }).click();
    const dialog = page.getByRole("dialog", { name: "New deal" });
    await expect(dialog.getByText("Demo data, not saved")).toBeVisible();

    await dialog.getByLabel("Title").fill("Harbour microgrid");
    await dialog.getByLabel("Customer").selectOption({ label: DEAL_COMPANY });
    await dialog.getByLabel("Value").fill("5000");
    await dialog.getByLabel("Stage").selectOption("negotiation");
    await dialog.getByRole("checkbox", { name: "Iris Vega" }).check();
    await dialog.getByRole("button", { name: "Create deal" }).click();

    await expect(dialog).toBeHidden();
    await expect(dealIn(page, "Negotiation", "Harbour microgrid")).toBeVisible();
    await expect(page.getByRole("main").getByRole("button", { name: "New deal" })).toBeFocused();
  });

  test("an empty New deal form names what is missing and keeps the window open", async ({ page }) => {
    await page.getByRole("main").getByRole("button", { name: "New deal" }).click();
    const dialog = page.getByRole("dialog", { name: "New deal" });

    await dialog.getByRole("button", { name: "Create deal" }).click();

    await expect(dialog.getByText("Enter a title.")).toBeVisible();
    await expect(dialog.getByText("Select a customer.")).toBeVisible();
    await expect(dialog.getByText("Enter a value above zero.")).toBeVisible();
    await expect(dialog.getByText("Select at least one owner.")).toBeVisible();
    await expect(dialog.getByLabel("Title")).toBeFocused();
  });

  test("the + of a column opens the same window with that stage preset", async ({ page }) => {
    await page.getByRole("button", { name: "Add deal to Closing" }).click();
    const dialog = page.getByRole("dialog", { name: "New deal" });
    await expect(dialog.getByLabel("Stage")).toHaveValue("closing");

    await dialog.getByLabel("Title").fill("Quay lighting");
    await dialog.getByLabel("Customer").selectOption({ label: DEAL_COMPANY });
    await dialog.getByLabel("Value").fill("800");
    await dialog.getByRole("checkbox", { name: "Kofi Mensah" }).check();
    await dialog.getByRole("button", { name: "Create deal" }).click();

    await expect(dealIn(page, "Closing", "Quay lighting")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add deal to Closing" })).toBeFocused();
  });

  test("Edit changes the card and the window starts from the deal", async ({ page }) => {
    await menuOf(page, DEAL).click();
    await page.getByRole("menuitem", { name: "Edit deal" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit deal" });
    await expect(dialog.getByLabel("Title")).toHaveValue(DEAL);

    await dialog.getByLabel("Title").fill("Rooftop array, phase 2");
    await dialog.getByRole("button", { name: "Save deal" }).click();

    await expect(dialog).toBeHidden();
    await expect(dealIn(page, "Qualification", "Rooftop array, phase 2")).toBeVisible();
    await expect(menuOf(page, "Rooftop array, phase 2")).toBeFocused();
  });

  test("moving a deal to another stage can be undone", async ({ page }) => {
    await menuOf(page, DEAL).click();
    await page.getByRole("menuitem", { name: "Move to stage" }).click();
    await page.getByRole("menuitem", { name: "Proposal" }).click();

    await expect(dealIn(page, "Proposal", DEAL)).toBeVisible();
    await expect(dealIn(page, "Qualification", DEAL)).toHaveCount(0);
    await expect(page.getByText(`${DEAL} moved to Proposal`)).toBeVisible();

    await page.getByRole("button", { name: "Undo" }).click();

    await expect(dealIn(page, "Qualification", DEAL)).toBeVisible();
    await expect(dealIn(page, "Proposal", DEAL)).toHaveCount(0);
  });

  test("marking a deal won takes it out of the board and adds it to the Won tile, and undo puts it back", async ({
    page,
  }) => {
    const won = page.getByRole("complementary", { name: "Closed this month" });
    const before = (await won.textContent()) ?? "";

    await menuOf(page, DEAL).click();
    await page.getByRole("menuitem", { name: "Mark as won" }).click();

    await expect(dealIn(page, "Qualification", DEAL)).toHaveCount(0);
    await expect(won).not.toHaveText(before);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(dealIn(page, "Qualification", DEAL)).toBeVisible();
    await expect(won).toHaveText(before);
  });

  test("Delete asks first with Cancel focused, and undo restores the deal", async ({ page }) => {
    await menuOf(page, DEAL).click();
    await page.getByRole("menuitem", { name: "Delete deal" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Delete this deal?" });
    await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(confirm.getByText("Demo data, not saved", { exact: false })).toBeVisible();

    await confirm.getByRole("button", { name: "Delete deal" }).click();

    await expect(dealIn(page, "Qualification", DEAL)).toHaveCount(0);
    await expect(stage(page, "Qualification")).toBeFocused();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(dealIn(page, "Qualification", DEAL)).toBeVisible();
  });

  test("cancelling the delete keeps the deal and returns focus to the menu button", async ({ page }) => {
    await menuOf(page, DEAL).click();
    await page.getByRole("menuitem", { name: "Delete deal" }).click();

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();

    await expect(dealIn(page, "Qualification", DEAL)).toBeVisible();
    await expect(menuOf(page, DEAL)).toBeFocused();
  });

  test("the card opens the deal panel, Escape closes it and focus returns to the card", async ({ page }) => {
    const opener = page.getByRole("button", { name: DEAL, exact: true });

    await opener.click();

    const panel = page.getByRole("dialog", { name: DEAL });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(`Deal with ${DEAL_COMPANY}`)).toBeVisible();
    await expect(panel.getByRole("button", { name: "Edit deal" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("the panel's Edit opens the edit window", async ({ page }) => {
    await page.getByRole("button", { name: DEAL, exact: true }).click();

    await page.getByRole("dialog", { name: DEAL }).getByRole("button", { name: "Edit deal" }).click();

    await expect(page.getByRole("dialog", { name: "Edit deal" }).getByLabel("Title")).toHaveValue(DEAL);
  });

  test("a row of the list view opens the same panel", async ({ page }) => {
    await page.getByRole("radiogroup", { name: "Pipeline view" }).getByRole("radio", { name: "List" }).click();

    await page
      .getByRole("row", { name: new RegExp(DEAL) })
      .getByRole("button", { name: DEAL })
      .click();

    await expect(page.getByRole("dialog", { name: DEAL })).toBeVisible();
  });

  test("Export downloads the filtered deals as CSV", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search deals" }).fill(DEAL);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export deals" }).click(),
    ]);
    const lines = (await readFile(await download.path(), "utf8")).replace("﻿", "").split("\r\n");

    expect(download.suggestedFilename()).toBe("deals.csv");
    expect(lines[0]).toBe('"Deal","Customer","Stage","Closes","Owners","Value","Currency"');
    expect(lines[1]).toMatch(
      new RegExp(
        `^"${DEAL}","${DEAL_COMPANY}","Qualification","2027-01-30","Kofi Mensah; Lea Brun","88200","[A-Z]{3}"$`,
      ),
    );
    expect(lines).toHaveLength(2);
  });

  test("has no control that does nothing: every button in the main region filters, opens a window or is a deal", async ({
    page,
  }) => {
    const names = await page
      .getByRole("main")
      .locator("button:not(h3 button)")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label") ?? button.textContent?.trim() ?? ""),
      );

    expect(
      names.filter(
        (name) =>
          !/^(Export deals|New deal|Add deal to .+|More actions for .+|Board|List|[A-Z]{2}(Iris|Kofi|Lea|Aditya|Tom))$/.test(
            name,
          ),
      ),
    ).toEqual([]);
  });
});

test.describe("deal cards on Home", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page }) => {
    problems = watch(page);
    await page.goto("/dashboard/default");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  const menus = (page: Page) => page.getByRole("button", { name: /^More actions for / });

  test("the menu of a hot deal deletes it after asking, and undo brings it back", async ({ page }) => {
    const count = await menus(page).count();

    await menus(page).first().click();
    await page.getByRole("menuitem", { name: "Delete deal" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete deal" }).click();

    await expect(menus(page)).toHaveCount(count - 1);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(menus(page)).toHaveCount(count);
  });

  test("a hot deal opens the deal panel", async ({ page }) => {
    await page.locator("h3 button").first().click();

    await expect(page.getByRole("dialog").getByRole("button", { name: "Edit deal" })).toBeVisible();
  });

  test("an edit made on Home shows on the Pipeline in the same session", async ({ page }) => {
    await menus(page).first().click();
    await page.getByRole("menuitem", { name: "Edit deal" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit deal" });
    await dialog.getByLabel("Title").fill("Renamed on Home");
    await dialog.getByRole("button", { name: "Save deal" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Renamed on Home" })).toBeVisible();

    await page.getByRole("link", { name: "Open pipeline" }).first().click();

    await expect(page.getByRole("heading", { level: 3, name: "Renamed on Home" })).toBeVisible();
  });

  test("the Revenue and Quota options, which had no destination, are gone", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Revenue options" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Quota options" })).toHaveCount(0);
  });
});

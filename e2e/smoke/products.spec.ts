import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The Products screen on the product views registry (plan 010, P5a): each preset lists the views it offers, each
 * view lists its seeded catalog items, and switching views keeps the table where it is. The wording is the `en`
 * dictionary and the data is the seeded mock of each preset, so nothing depends on the clock or on chance.
 */

const MENU_ITEMS = ["Ham croquettes", "Seafood rice", "House flan", "Catch of the day", "Tasting menu"];
const SHOP_ITEMS = ["House olive oil, 500 ml", "House red wine, bottle", "Smoked paprika, tin"];
const SALON_SHOP_ITEMS = ["Repair shampoo, 250 ml", "Hydrating conditioner, 250 ml", "Styling wax, 75 ml"];
const STOCK_ITEMS = [
  "Repair shampoo, 250 ml",
  "Conditioner, 250 ml",
  "Styling wax, 75 ml",
  "Hair dye, 60 ml tube",
  "Developer, 1 litre",
];
const ORDER_IDS = ["PO-W-1", "PO-W-2", "PO-W-3", "PO-W-4"];
const PARTS_ITEMS = ["Front brake pads", "Oil filter", "Air filter", "Wiper blades, pair"];

/** The table of the view shown: its label is the view's, so the helper takes the only table on the page. */
const productsTable = (page: Page) => page.getByRole("table");
const rowNames = (page: Page) => productsTable(page).locator("tbody tr td:first-child");
const views = (page: Page) => page.getByRole("radiogroup", { name: "Product views" });

test.describe("hospitality products", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "hospitality", url: baseURL },
    ]);
    problems = watch(page);
    await page.goto("/dashboard/products");
    await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("offers the Menu and then the Shop, with the Menu shown first", async ({ page }) => {
    await expect(views(page).getByRole("radio")).toHaveText(["Menu", "Shop"]);
    await expect(views(page).getByRole("radio", { name: "Menu" })).toBeChecked();
  });

  test("the Menu lists the seeded dishes", async ({ page }) => {
    await expect(rowNames(page)).toHaveText(MENU_ITEMS);
  });

  test("the Shop lists the seeded goods", async ({ page }) => {
    await views(page).getByRole("radio", { name: "Shop" }).click();

    await expect(rowNames(page)).toHaveText(SHOP_ITEMS);
  });

  test("switching views does not move the table", async ({ page }) => {
    await expect(rowNames(page)).toHaveText(MENU_ITEMS);
    const before = await productsTable(page).boundingBox();

    await views(page).getByRole("radio", { name: "Shop" }).click();
    await expect(rowNames(page)).toHaveText(SHOP_ITEMS);
    const after = await productsTable(page).boundingBox();

    expect(after?.y).toBe(before?.y);
  });

  test("search narrows the view", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search products" }).fill("rice");

    await expect(rowNames(page)).toHaveText(["Seafood rice"]);
  });

  test("the nav entry leads to the page", async ({ page }) => {
    await page.goto("/dashboard/default");
    await page
      .getByRole("navigation", { name: "Sections" })
      .getByRole("link", { name: "Products", exact: true })
      .click();

    await expect(page).toHaveURL(/\/dashboard\/products$/);
    await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
  });
});

test.describe("salon products", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "salon", url: baseURL },
    ]);
    problems = watch(page);
    await page.goto("/dashboard/products");
    await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("offers the Shop and then the Stock, with the Shop shown first", async ({ page }) => {
    await expect(views(page).getByRole("radio")).toHaveText(["Shop", "Stock"]);
    await expect(rowNames(page)).toHaveText(SALON_SHOP_ITEMS);
  });

  test("the Stock lists its items with their suppliers, one below its reorder point", async ({ page }) => {
    await views(page).getByRole("radio", { name: "Stock" }).click();

    await expect(rowNames(page)).toHaveText(STOCK_ITEMS);
    await expect(page.getByRole("row", { name: /Developer, 1 litre/ })).toContainText("5 litres");
    await expect(page.getByRole("row", { name: /Developer, 1 litre/ })).toContainText("Cosméticas Profesionales");
    await expect(page.getByText("Below reorder point")).toHaveCount(1);
    await expect(page.getByRole("row", { name: /Styling wax/ })).toContainText("Below reorder point");
    await expect(page.getByRole("row", { name: /Styling wax/ })).toContainText("3 jars");
  });

  test("the level filter keeps what is below its reorder point", async ({ page }) => {
    await views(page).getByRole("radio", { name: "Stock" }).click();
    await page.getByRole("combobox", { name: "Filter stock level" }).click();
    await page.getByRole("option", { name: "Below reorder point" }).click();

    await expect(rowNames(page)).toHaveText(["Styling wax, 75 ml"]);
  });

  test("switching views does not move the table", async ({ page }) => {
    await expect(rowNames(page)).toHaveText(SALON_SHOP_ITEMS);
    const before = await productsTable(page).boundingBox();

    await views(page).getByRole("radio", { name: "Stock" }).click();
    await expect(rowNames(page)).toHaveText(STOCK_ITEMS);
    const after = await productsTable(page).boundingBox();

    expect(after?.y).toBe(before?.y);
  });
});

test.describe("workshop products", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "workshop", url: baseURL },
    ]);
    problems = watch(page);
    await page.goto("/dashboard/products");
    await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("offers the Parts and then the Supplier orders, with the Parts shown first", async ({ page }) => {
    await expect(views(page).getByRole("radio")).toHaveText(["Parts", "Supplier orders"]);
    await expect(rowNames(page)).toHaveText(PARTS_ITEMS);
  });

  test("the Supplier orders list their suppliers, statuses, dates and totals", async ({ page }) => {
    await views(page).getByRole("radio", { name: "Supplier orders" }).click();

    await expect(rowNames(page)).toHaveText(ORDER_IDS);
    const sent = page.getByRole("row", { name: /PO-W-2/ });
    await expect(sent).toContainText("Recambios Norte");
    await expect(sent).toContainText("Sent");
    await expect(sent).toContainText("Oct 29, 2026");
    await expect(sent).toContainText("Nov 3, 2026");
    await expect(sent).toContainText("€142.00");
    await expect(page.getByRole("row", { name: /PO-W-1/ })).toContainText("Distribuciones Levante");
    await expect(page.getByRole("row", { name: /PO-W-1/ })).toContainText("Received");
    await expect(page.getByRole("row", { name: /PO-W-3/ })).toContainText("Draft");
    await expect(page.getByRole("row", { name: /PO-W-4/ })).toContainText("Cancelled");
  });

  test("the status filter narrows the orders", async ({ page }) => {
    await views(page).getByRole("radio", { name: "Supplier orders" }).click();
    await page.getByRole("combobox", { name: "Filter order status" }).click();
    await page.getByRole("option", { name: "Draft" }).click();

    await expect(rowNames(page)).toHaveText(["PO-W-3"]);
  });

  test("switching views does not move the table", async ({ page }) => {
    await expect(rowNames(page)).toHaveText(PARTS_ITEMS);
    const before = await productsTable(page).boundingBox();

    await views(page).getByRole("radio", { name: "Supplier orders" }).click();
    await expect(rowNames(page)).toHaveText(ORDER_IDS);
    const after = await productsTable(page).boundingBox();

    expect(after?.y).toBe(before?.y);
  });
});

/** The selects of the view shown on first load read their value, whatever mounts them (a regression of P5b). */
for (const preset of ["hospitality", "salon", "workshop"]) {
  test(`${preset}: the first view's selects read their values on first load`, async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: preset, url: baseURL },
    ]);
    await page.goto("/dashboard/products");

    await expect(page.getByRole("combobox", { name: "Filter product status" })).toHaveText("All statuses");
    await expect(page.getByRole("combobox", { name: "Rows per page" })).toHaveText("10");
  });
}

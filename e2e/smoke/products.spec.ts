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
const PARTS_ITEMS = ["Front brake pads", "Oil filter", "Air filter", "Wiper blades, pair"];

const productsTable = (page: Page) => page.getByRole("table", { name: "Products" });
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

test.describe("presets with one view", () => {
  test("a salon shows its Shop and no toggle", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "salon", url: baseURL },
    ]);
    const problems = watch(page);
    await page.goto("/dashboard/products");

    await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
    await expect(rowNames(page)).toHaveText(SALON_SHOP_ITEMS);
    await expect(views(page)).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test("a workshop shows its Parts and no toggle", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "workshop", url: baseURL },
    ]);
    const problems = watch(page);
    await page.goto("/dashboard/products");

    await expect(rowNames(page)).toHaveText(PARTS_ITEMS);
    await expect(views(page)).toHaveCount(0);
    expect(problems).toEqual([]);
  });
});

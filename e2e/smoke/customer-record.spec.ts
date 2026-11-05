import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * A customer's record page on the data seam (spec 012, R2): from the directory to `/dashboard/customers/<id>`, the
 * trail back, the tabs and the not-found page. The wording is the `en` dictionary and the data is the seeded
 * hospitality mock: Ortega has one note and a kept record of 6 visits, Calvo has one visit and no note, phone or consent.
 */

const ORTEGA = "Ortega";
const ORTEGA_PATH = "/dashboard/customers/C-ortega";
const CALVO_PATH = "/dashboard/customers/C-calvo";
const ORTEGA_NOTE = "One guest is coeliac";
const NOTE_BYLINE = "Alex Morgan · Sep 30, 2026, 9:00 PM";

const trail = (page: Page) => page.getByRole("navigation", { name: "Breadcrumb" });
const tab = (page: Page, name: string) => page.getByRole("tab", { name });

test.describe("customer record page", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("a name in the directory opens the customer's page with its heading, tabs and trail", async ({ page }) => {
    await page.goto("/dashboard/customers");
    await page.getByRole("link", { name: ORTEGA, exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`${ORTEGA_PATH}$`));
    await expect(page.getByRole("heading", { level: 1, name: ORTEGA })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveText(["Overview", "Notes", "Contact"]);
    await expect(trail(page).locator("a[href]")).toHaveText(["Home", "Guests"]);
    await expect(trail(page).locator('[aria-current="page"]')).toHaveText(ORTEGA);
  });

  test("the trail's list link returns to the directory", async ({ page }) => {
    await page.goto(ORTEGA_PATH);
    await trail(page).getByRole("link", { name: "Guests" }).click();

    await expect(page).toHaveURL(/\/dashboard\/customers$/);
    await expect(page.getByRole("heading", { level: 1, name: "Guests" })).toBeVisible();
  });

  test("the trail's home link opens a page", async ({ page }) => {
    await page.goto(ORTEGA_PATH);
    await trail(page).getByRole("link", { name: "Home" }).click();

    await expect(page).toHaveURL(/\/dashboard\/default$/);
  });

  test("the title is the customer's name and the page is not indexed", async ({ page }) => {
    await page.goto(ORTEGA_PATH);

    await expect(page).toHaveTitle(new RegExp(ORTEGA));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("the attendance ring has a text alternative", async ({ page }) => {
    await page.goto(ORTEGA_PATH);

    await expect(page.getByText("Kept 6 of 6 booked visits")).toBeAttached();
  });

  test("the overview shows the figures, the preferences and the status", async ({ page }) => {
    await page.goto(ORTEGA_PATH);

    const overview = page.getByRole("tabpanel", { name: "Overview" });
    await expect(overview.getByText("Visits", { exact: true })).toBeVisible();
    await expect(overview.getByText("No-shows", { exact: true })).toBeVisible();
    await expect(overview.getByText("Spanish")).toBeVisible();
    await expect(overview.getByRole("region", { name: "Status" }).getByText("Active")).toBeVisible();
  });

  test("the notes tab lists the note with its author and time", async ({ page }) => {
    await page.goto(ORTEGA_PATH);
    await tab(page, "Notes").click();

    await expect(page.getByText(ORTEGA_NOTE)).toBeVisible();
    await expect(page.getByText(NOTE_BYLINE)).toBeVisible();
  });

  test("a customer with no notes says so", async ({ page }) => {
    await page.goto(CALVO_PATH);
    await tab(page, "Notes").click();

    await expect(page.getByText("No notes yet")).toBeVisible();
  });

  test("the contact tab lists the details, and says what was not given", async ({ page }) => {
    await page.goto(CALVO_PATH);
    await tab(page, "Contact").click();

    const contact = page.getByRole("tabpanel", { name: "Contact" });
    await expect(contact.getByText("calvo@example.com")).toBeVisible();
    await expect(contact.getByText("Not given")).toHaveCount(1);
  });

  test("the page does not scroll sideways", async ({ page }) => {
    await page.goto(ORTEGA_PATH);
    await expect(page.getByRole("heading", { level: 1, name: ORTEGA })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("customer record page, unknown id", () => {
  test("shows the not-found page", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    await page.goto("/dashboard/customers/nope");

    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });
});

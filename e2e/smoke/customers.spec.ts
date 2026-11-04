import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";
import { readFile } from "node:fs/promises";

/**
 * The customers directory on the data seam (plan 003, C2): the seeded customers of the preset, search, Export, the
 * contact links and the redirect from the template route. The wording is the `en` dictionary and the data is the
 * seeded hospitality mock, so nothing depends on the clock or on chance.
 */

const emailLink = (page: Page, name: string) => page.getByRole("link", { name: `Email ${name}` });
const callLink = (page: Page, name: string) => page.getByRole("link", { name: `Call ${name}` });

test.describe("customers directory", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/customers");
    await expect(page.getByRole("heading", { level: 1, name: "Guests" })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("lists the seeded customers, A to Z", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Bravo", "Calvo", "Iglesias", "Ortega"]);
  });

  test("search narrows the list", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search contacts" }).fill("ortega");

    await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Ortega"]);
  });

  test("a search with no match says so", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search contacts" }).fill("zzzz");

    await expect(page.getByText("No contacts found")).toBeVisible();
    await expect(page.getByText("Nothing matches “zzzz”.")).toBeVisible();
  });

  test("the VIP filter keeps only VIP customers", async ({ page }) => {
    await page.getByRole("radiogroup", { name: "Show" }).getByRole("radio", { name: "VIP" }).click();

    await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Bravo"]);
  });

  test("Export downloads the filtered list as CSV", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search contacts" }).fill("ortega");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export" }).click(),
    ]);
    const lines = (await readFile(await download.path(), "utf8")).replace("﻿", "").split("\r\n");

    expect(download.suggestedFilename()).toBe("customers.csv");
    expect(lines[0]).toBe('"Name","Email","Phone","Tags","VIP","Blocked","Visits","Spend","Currency","Last visit"');
    expect(lines[1]).toBe('"Ortega","ortega@example.com","\'+34600000102","","No","No","6","312","EUR","2026-09-30"');
    expect(lines).toHaveLength(2);
  });

  test("Email and Call are mailto and tel links, only when the customer has the detail", async ({ page }) => {
    await expect(emailLink(page, "Ortega")).toHaveAttribute("href", "mailto:ortega@example.com");
    await expect(callLink(page, "Ortega")).toHaveAttribute("href", "tel:+34600000102");
    await expect(emailLink(page, "Bravo")).toHaveCount(0);
    await expect(callLink(page, "Calvo")).toHaveCount(0);
  });

  test("the table view keeps the contact links", async ({ page }) => {
    await page.getByRole("radiogroup", { name: "Directory view" }).getByRole("radio", { name: "Table" }).click();

    await expect(page.getByRole("row", { name: /Ortega/ })).toBeVisible();
    await expect(emailLink(page, "Ortega")).toHaveAttribute("href", "mailto:ortega@example.com");
  });

  test("has no control that does nothing: the only buttons filter, sort, switch view, add a contact or export", async ({
    page,
  }) => {
    const names = await page
      .getByRole("main")
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label") ?? button.textContent?.trim() ?? ""),
      );

    expect(names).toEqual(["Name (A–Z)", "Add contact", "Export"]);
  });

  test("a later page starts where its cursor says and links back to the first", async ({ page }) => {
    // The opaque cursor of the mock is base64url of {"o": offset}; the seed lists Iglesias, Ortega, Bravo, Calvo.
    await page.goto(`/dashboard/customers?cursor=${Buffer.from('{"o":3}').toString("base64url")}`);

    await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Calvo"]);
    await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "First page" }).click();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(4);
  });

  test("an invalid cursor shows the error state, not an empty list", async ({ page }) => {
    await page.goto("/dashboard/customers?cursor=nope");

    await expect(page.locator('[data-state="error"]')).toContainText("Could not load this");
  });
});

test.describe("new contact window", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/customers");
    await expect(page.getByRole("heading", { level: 1, name: "Guests" })).toBeVisible();
    await page.getByRole("main").getByRole("button", { name: "Add contact" }).click();
    await expect(windowOf(page)).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  const windowOf = (page: Page) => page.getByRole("dialog", { name: "Add contact" });

  test("Enter on an empty form puts focus on the first invalid field", async ({ page }) => {
    await page.keyboard.press("Enter");

    await expect(windowOf(page).getByRole("textbox", { name: "Name" })).toBeFocused();
    await expect(windowOf(page).getByText("Enter a name.")).toBeVisible();
  });

  test("a valid contact is created, announced and listed", async ({ page }) => {
    await windowOf(page).getByRole("textbox", { name: "Name" }).fill("Zoe Quintana");
    await windowOf(page).getByRole("textbox", { name: "Phone" }).fill("+34 611 222 333");
    await windowOf(page).getByRole("textbox", { name: "Email" }).fill("zoe@example.com");
    await windowOf(page).getByRole("button", { name: "Add contact" }).click();

    await expect(windowOf(page)).toBeHidden();
    await expect(page.locator("[data-sonner-toast]").first()).toContainText("Contact added: Zoe Quintana");
    await expect(page.getByRole("heading", { level: 3 })).toHaveText([
      "Bravo",
      "Calvo",
      "Iglesias",
      "Ortega",
      "Zoe Quintana",
    ]);
    await expect(page.getByRole("main").getByRole("button", { name: "Add contact" })).toBeFocused();
  });

  test("a duplicate phone shows the notice with its link and creates nothing", async ({ page }) => {
    await windowOf(page).getByRole("textbox", { name: "Name" }).fill("Someone Else");
    await windowOf(page).getByRole("textbox", { name: "Phone" }).fill("+34 600 000 102");

    const link = windowOf(page).getByRole("link", { name: "Show Ortega" });
    await expect(link).toHaveAttribute("href", "/dashboard/customers?q=%2B34600000102");
    await expect(windowOf(page).getByText("Same phone")).toBeVisible();

    await windowOf(page).getByRole("button", { name: "Add contact" }).click();
    await expect(
      windowOf(page)
        .getByText(/already exists/)
        .first(),
    ).toBeVisible();

    await link.click();
    await expect(page).toHaveURL(/q=%2B34600000102$/);
    await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Ortega"]);

    await page.goto("/dashboard/customers");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(4);
  });

  test("a dirty window asks before it closes", async ({ page }) => {
    await windowOf(page).getByRole("textbox", { name: "Name" }).fill("Half typed");
    await page.keyboard.press("Escape");

    await expect(page.getByRole("alertdialog", { name: "Discard changes?" })).toBeVisible();
    await page.getByRole("button", { name: "Keep editing" }).click();
    await expect(windowOf(page).getByRole("textbox", { name: "Name" })).toHaveValue("Half typed");

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Discard" }).click();

    await expect(windowOf(page)).toBeHidden();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(4);
  });

  test("an untouched window closes without asking", async ({ page }) => {
    await page.keyboard.press("Escape");

    await expect(windowOf(page)).toBeHidden();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });

  test("the first write of a visitor with no session cookie starts the demo session", async ({ page, context }) => {
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("demo_sid");

    await windowOf(page).getByRole("textbox", { name: "Name" }).fill("First Writer");
    await windowOf(page).getByRole("button", { name: "Add contact" }).click();

    await expect(page.getByRole("heading", { level: 3, name: "First Writer" })).toBeVisible();
    expect((await context.cookies()).map((cookie) => cookie.name)).toContain("demo_sid");
  });
});

test.describe("customers in other presets", () => {
  test("a salon calls them clients", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "salon", url: baseURL },
    ]);
    await page.goto("/dashboard/customers");

    await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Nora" })).toBeVisible();
  });
});

test.describe("the template route", () => {
  test("/dashboard/users redirects permanently to /dashboard/customers", async ({ page, request }) => {
    const response = await request.get("/dashboard/users", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toContain("/dashboard/customers");

    await page.goto("/dashboard/users");
    await expect(page).toHaveURL(/\/dashboard\/customers$/);
  });
});

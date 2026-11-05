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

const NEW_EMAIL = "ortega.new@example.com";
const NEW_NOTE = "Prefers the corner table";
const BLOCK_REASON = "Left without paying";

const windowOf = (page: Page, name: string) => page.getByRole("dialog", { name });
const toast = (page: Page) => page.locator("[data-sonner-toast]").first();
const header = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

/** Blocks the customer through the window, as the owner does, and waits for the page to show it. */
const block = async (page: Page) => {
  await header(page, "Block").click();
  await windowOf(page, "Block customer").getByRole("textbox", { name: "Reason" }).fill(BLOCK_REASON);
  await windowOf(page, "Block customer").getByRole("button", { name: "Block", exact: true }).click();
  await expect(windowOf(page, "Block customer")).toBeHidden();
  await expect(header(page, "Unblock")).toBeVisible();
  await expect(header(page, "Unblock")).toBeFocused();
};

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

/**
 * The writes, as the owner (the default demo role). Every test has a browser context of its own, so its first write
 * starts a demo session of its own and nothing leaks between tests. The default roles all hold `update:customers` and
 * `block:customers` (the staff role is "reads-and-writes"), so no role hides these controls end to end; the hiding
 * is covered by `abilitiesOf` in its unit test.
 */
test.describe("customer record writes", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto(ORTEGA_PATH);
    await expect(page.getByRole("heading", { level: 1, name: ORTEGA })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("edit contact changes the email, and the Contact tab shows it", async ({ page }) => {
    await header(page, "Edit contact").click();
    await windowOf(page, "Edit contact").getByRole("textbox", { name: "Email" }).fill(NEW_EMAIL);
    await windowOf(page, "Edit contact").getByRole("button", { name: "Edit contact", exact: true }).click();

    await expect(windowOf(page, "Edit contact")).toBeHidden();
    await expect(toast(page)).toContainText("Contact updated");
    await tab(page, "Contact").click();
    await expect(page.getByRole("tabpanel", { name: "Contact" }).getByText(NEW_EMAIL)).toBeVisible();
  });

  test("a cleared phone is removed, not left unchanged", async ({ page }) => {
    await header(page, "Edit contact").click();
    await windowOf(page, "Edit contact").getByRole("textbox", { name: "Phone" }).fill("");
    await windowOf(page, "Edit contact").getByRole("button", { name: "Edit contact", exact: true }).click();

    await expect(windowOf(page, "Edit contact")).toBeHidden();
    await tab(page, "Contact").click();
    await expect(page.getByRole("tabpanel", { name: "Contact" }).getByText("Not given")).toHaveCount(1);
  });

  test("the duplicate notice names another customer with the same phone", async ({ page }) => {
    await header(page, "Edit contact").click();
    const edit = windowOf(page, "Edit contact");
    await edit.getByRole("textbox", { name: "Phone" }).fill("+34 600 000 103");

    await expect(edit.getByRole("link", { name: "Show Bravo" })).toBeVisible();
  });

  test("the duplicate notice leaves out the customer being edited", async ({ page }) => {
    await header(page, "Edit contact").click();
    const edit = windowOf(page, "Edit contact");
    // The lookup is a Server Action; its answer, not a timer, says it has run. Ortega's own phone matches only Ortega.
    const lookup = page.waitForResponse((response) => response.request().method() === "POST" && response.ok());
    await edit.getByRole("textbox", { name: "Phone" }).fill("+34 600 000 102");
    await lookup;

    await expect(edit.getByRole("link", { name: "Show Ortega" })).toHaveCount(0);
    await expect(edit.locator('[data-slot="duplicate-notice"]')).toBeEmpty();
  });

  test("add note puts the note first in Notes", async ({ page }) => {
    await header(page, "Add note").click();
    await windowOf(page, "Add note").getByRole("textbox", { name: "Note" }).fill(NEW_NOTE);
    await windowOf(page, "Add note").getByRole("button", { name: "Add note", exact: true }).click();

    await expect(windowOf(page, "Add note")).toBeHidden();
    await expect(toast(page)).toContainText("Note added");
    await tab(page, "Notes").click();
    await expect(page.getByRole("tabpanel", { name: "Notes" }).getByRole("listitem").first()).toContainText(NEW_NOTE);
  });

  test("a note needs text", async ({ page }) => {
    await header(page, "Add note").click();
    await windowOf(page, "Add note").getByRole("button", { name: "Add note", exact: true }).click();

    await expect(windowOf(page, "Add note").getByText("Enter a note.")).toBeVisible();
  });

  test("block asks for a reason and the header then shows Blocked and the reason", async ({ page }) => {
    await block(page);

    await expect(page.getByRole("main").getByText("Blocked").first()).toBeVisible();
    await expect(page.getByText(`Reason: ${BLOCK_REASON}`)).toBeVisible();
    await expect(header(page, "Block")).toHaveCount(0);
  });

  test("unblock acts at once, the toast names the reason, and Undo blocks again", async ({ page }) => {
    await block(page);
    await header(page, "Unblock").click();

    await expect(header(page, "Block")).toBeFocused();
    await expect(toast(page)).toContainText(`Undo blocks again for “${BLOCK_REASON}”`);
    await expect(page.getByText(`Reason: ${BLOCK_REASON}`)).toHaveCount(0);

    await toast(page).getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText(`Reason: ${BLOCK_REASON}`)).toBeVisible();
    await expect(header(page, "Unblock")).toBeVisible();
  });

  for (const [name, title] of [
    ["Edit contact", "Edit contact"],
    ["Add note", "Add note"],
    ["Block", "Block customer"],
  ]) {
    test(`opening ${name} does not move the page`, async ({ page }) => {
      // CSS locators, not roles: the page behind an open dialog is hidden from the accessibility tree.
      const heading = page.locator("h1");
      const tabs = page.locator('[role="tablist"]');
      const headingBefore = await heading.boundingBox();
      const tabsBefore = await tabs.boundingBox();

      await header(page, name).click();
      await expect(windowOf(page, title)).toBeVisible();

      expect(headingBefore).toBeTruthy();
      expect(await heading.boundingBox()).toEqual(headingBefore);
      expect(await tabs.boundingBox()).toEqual(tabsBefore);
    });
  }
});

test.describe("customer record page, unknown id", () => {
  test("shows the not-found page", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    await page.goto("/dashboard/customers/nope");

    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });
});

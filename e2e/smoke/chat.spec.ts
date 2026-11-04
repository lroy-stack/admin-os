import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The chat app (plan 003, M3 and M4) on demo-local state: replies and internal notes join the thread, New conversation
 * starts one, the sidebar, tabs, search and filter narrow the list, and snooze, block, call and email do their jobs.
 * The wording is the `en` dictionary and the data is the demo's conversations. Runs at 1440 and 375 px: on a phone the
 * sidebar is a sheet and the list and the thread are two screens.
 */

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
const conversation = (page: Page, name: string) => page.getByRole("button", { name: new RegExp(name) });

/** Opens a conversation: on a phone this slides the thread over the list. */
async function open(page: Page, name: string) {
  await conversation(page, name).click();
  await expect(page.getByRole("button", { name: "More actions" })).toBeVisible();
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
});

test.describe("chat", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page }) => {
    problems = watch(page);
    await page.goto("/chat");
    await expect(conversation(page, "Olivia Rhye")).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("a reply and an internal note join the thread", async ({ page }) => {
    await open(page, "Olivia Rhye");
    await expect(page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();

    await page.getByRole("textbox", { name: "Reply", exact: true }).fill("On my way, back in five.");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText("On my way, back in five.", { exact: true }).first()).toBeVisible();

    await page.getByRole("tab", { name: "Internal note" }).click();
    await page.getByRole("textbox", { name: "Internal note" }).fill("Ask billing about the invoice.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Ask billing about the invoice.")).toBeVisible();
    await expect(page.getByText(/^Internal note · /)).toBeVisible();
  });

  test("New conversation validates, starts a thread and lists it", async ({ page }) => {
    await page.getByRole("button", { name: "New conversation" }).click();
    const dialog = page.getByRole("dialog", { name: "New conversation" });
    await expect(dialog.getByText("Demo data, not saved")).toBeVisible();

    await dialog.getByRole("button", { name: "Start conversation" }).click();
    await expect(dialog.getByText("Enter the contact’s name.")).toBeVisible();
    await expect(dialog.getByText("Enter a subject.")).toBeVisible();
    await expect(dialog.getByText("Write a message.")).toBeVisible();

    await dialog.getByLabel("Contact name").fill("Bea Costa");
    await dialog.getByLabel("Channel").selectOption("phone");
    await dialog.getByLabel("Subject").fill("Table for eight");
    await dialog.getByLabel("First message").fill("Hello Bea, your table is ready.");
    await dialog.getByRole("button", { name: "Start conversation" }).click();

    await expect(dialog).toBeHidden();
    await expect(conversation(page, "Bea Costa")).toBeVisible();
  });

  test("search, channels, tabs and the filter narrow the list", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search conversations…" }).fill("olivia");
    await expect(conversation(page, "Olivia Rhye")).toBeVisible();
    await expect(conversation(page, "Phoenix Baker")).toBeHidden();
    await page.getByRole("searchbox", { name: "Search conversations…" }).fill("zzzz");
    await expect(page.getByText("No conversations found")).toBeVisible();
    await page.getByRole("searchbox", { name: "Search conversations…" }).fill("");

    await page.getByRole("tab", { name: /^Snoozed/ }).click();
    await expect(page.getByText("No conversations", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: /^All/ }).click();

    if (isPhone(page)) await page.getByRole("button", { name: "Toggle sidebar" }).click();
    await page.getByRole("button", { name: "Phone", exact: true }).click();
    await expect(conversation(page, "Olivia Rhye")).toBeHidden();
  });

  test("Filter keeps the unread conversations", async ({ page }) => {
    await page.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("checkbox", { name: "Priority only" }).check();
    await expect(page.getByText("No conversations found")).toBeVisible();
    await page.getByRole("checkbox", { name: "Priority only" }).uncheck();
    await page.getByRole("checkbox", { name: "Unread only" }).check();
    await page.keyboard.press("Escape");
    await expect(conversation(page, "Olivia Rhye")).toBeVisible();
  });

  test("Snooze sets the conversation aside and Undo brings it back", async ({ page }) => {
    await open(page, "Olivia Rhye");
    await page.getByRole("button", { name: "Snooze", exact: true }).click();
    await page.getByRole("button", { name: "Tomorrow" }).click();

    await expect(page.getByText("Snoozed until tomorrow").first()).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Snoozed until tomorrow")).toBeHidden();
  });

  test("Block contact asks first, closes the conversation and Undo restores it", async ({ page }) => {
    await open(page, "Olivia Rhye");
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Block contact" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText("Block Olivia Rhye?")).toBeVisible();

    await dialog.getByRole("button", { name: "Block contact" }).click();
    await expect(page.getByText("Blocked", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Blocked", { exact: true })).toBeHidden();
  });

  test("Mark as priority flags the conversation in the list", async ({ page }) => {
    await open(page, "Olivia Rhye");
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Mark as priority" }).click();

    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Remove priority" })).toBeVisible();
  });

  test("Call and the profile's Email and Call are links", async ({ page }) => {
    await open(page, "Olivia Rhye");
    await expect(page.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+14155550123");

    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "View profile" }).click();
    await expect(page.getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      "mailto:olivia.rhye@weblabs.studio",
    );
    await expect(page.getByRole("link", { name: "Call" }).last()).toHaveAttribute("href", "tel:+14155550123");
  });
});

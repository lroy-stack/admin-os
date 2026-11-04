import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The mail app (plan 003, M1 and M2) on demo-local state: folders and search filter the list, a message is replied to,
 * forwarded, archived and trashed with undo, and New email lands in Sent. The wording is the `en` dictionary and the
 * data is the demo's mails, so nothing depends on the clock. Runs at 1440 and 375 px: on a phone the sidebar is a sheet
 * and the open message is a drawer.
 */

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
const mailItem = (page: Page, subject: string) => page.getByRole("button", { name: new RegExp(subject) });

/** Opens the sidebar on a phone, where it is a sheet that closes when something is chosen; on a desktop it is always there. */
async function withSidebar(page: Page, act: () => Promise<void>) {
  if (isPhone(page)) await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await act();
}

/** On a phone the open message is a drawer over the list. */
async function closeMessage(page: Page) {
  if (isPhone(page)) await page.getByRole("button", { name: "Close message" }).click();
}

const chooseFolder = (page: Page, name: string) =>
  withSidebar(page, () => page.getByRole("button", { name, exact: true }).click());

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
});

test.describe("mail", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page }) => {
    problems = watch(page);
    await page.goto("/mail");
    await expect(mailItem(page, "Meeting Tomorrow")).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("folders and search filter the list", async ({ page }) => {
    await chooseFolder(page, "Sent");
    await expect(page.getByText("No messages", { exact: true })).toBeVisible();
    await expect(mailItem(page, "Meeting Tomorrow")).toBeHidden();

    await chooseFolder(page, "Inbox");
    await page.getByRole("searchbox", { name: "Search…" }).fill("hiking");
    await expect(mailItem(page, "Weekend Plans")).toBeVisible();
    await expect(mailItem(page, "Meeting Tomorrow")).toBeHidden();

    await page.getByRole("searchbox", { name: "Search…" }).fill("zzzz");
    await expect(page.getByText("No messages found")).toBeVisible();
  });

  test("New email validates, sends and lands in Sent", async ({ page }) => {
    await withSidebar(page, () => page.getByRole("button", { name: "New email" }).click());
    const dialog = page.getByRole("dialog", { name: "New email" });
    await expect(dialog.getByText("Demo data, not saved")).toBeVisible();

    await dialog.getByRole("button", { name: "Send" }).click();
    await expect(dialog.getByText("Enter at least one address.")).toBeVisible();
    await expect(dialog.getByText("Enter a subject.")).toBeVisible();
    await expect(dialog.getByText("Write a message.")).toBeVisible();

    await dialog.getByLabel("To").fill("bea@example.com");
    await dialog.getByLabel("Subject").fill("Opening hours");
    await dialog.getByLabel("Message").fill("We open at nine.");
    await dialog.getByRole("button", { name: "Send" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Email sent to Sent")).toBeVisible();
    await chooseFolder(page, "Sent");
    await expect(mailItem(page, "Opening hours")).toBeVisible();
  });

  test("a reply joins the thread of the message", async ({ page }) => {
    await mailItem(page, "Weekend Plans").click();
    const reply = page.getByRole("textbox", { name: "Reply", exact: true });
    await expect(page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();

    await reply.fill("Count me in for Saturday.");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(page.getByText("Count me in for Saturday.")).toBeVisible();
    await expect(reply).toHaveValue("");
  });

  test("Reply all takes focus to the composer and names who it goes to", async ({ page }) => {
    await mailItem(page, "Meeting Tomorrow").click();
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Reply all" }).click();

    await expect(page.getByRole("textbox", { name: "Reply all" })).toBeFocused();
    await expect(page.getByText("Replying to William Smith")).toBeVisible();
  });

  test("Forward opens New email with the message quoted", async ({ page }) => {
    await mailItem(page, "Meeting Tomorrow").click();
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Forward" }).click();
    const dialog = page.getByRole("dialog", { name: "Forward email" });

    await expect(dialog.getByLabel("Subject")).toHaveValue("Fwd: Meeting Tomorrow");
    await dialog.getByLabel("To").fill("bea@example.com");
    await dialog.getByRole("button", { name: "Send" }).click();

    await expect(dialog).toBeHidden();
    await closeMessage(page);
    await chooseFolder(page, "Sent");
    await expect(mailItem(page, "Fwd: Meeting Tomorrow")).toBeVisible();
  });

  test("Move to trash removes the message and Undo brings it back", async ({ page }) => {
    await mailItem(page, "Weekend Plans").click();
    await page.getByRole("button", { name: "Move to trash" }).click();

    await expect(page.getByText("Message moved to trash")).toBeVisible();
    await expect(mailItem(page, "Weekend Plans")).toBeHidden();
    await chooseFolder(page, "Trash");
    await expect(mailItem(page, "Weekend Plans")).toBeVisible();

    await chooseFolder(page, "Inbox");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(mailItem(page, "Weekend Plans")).toBeVisible();
  });

  test("Pin, Add label and Next work on the open message", async ({ page }) => {
    await mailItem(page, "Meeting Tomorrow").click();
    await page.getByRole("button", { name: "Pin thread" }).click();
    await expect(page.getByRole("button", { name: "Pin thread" })).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("button", { name: "Add label" }).click();
    await page.getByRole("checkbox", { name: "Travel" }).check();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("list").getByText("Travel")).toBeVisible();

    await page.getByRole("button", { name: "Next message" }).click();
    await expect(page.getByRole("button", { name: "Previous message" })).toBeEnabled();
  });
});

import { expect, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The bell (plan 003 H1b): the header shows the actor's real unread count, the panel lists the seeded notifications,
 * an unread row marks itself read and "Mark all as read" clears the count. The wording is the `en` dictionary and the
 * data is the seeded hospitality mock on its fixed clock.
 */

test.describe("notifications bell", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/default");
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("opens the panel with the unread notifications", async ({ page }) => {
    await page.getByRole("button", { name: /unread notification/ }).click();
    const panel = page.getByRole("dialog", { name: "Notifications" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("button", { name: /^Mark (?!all ).+ as read$/ }).first()).toBeVisible();
  });

  test("clears the unread count with Mark all as read", async ({ page }) => {
    await page.getByRole("button", { name: /unread notification/ }).click();
    const panel = page.getByRole("dialog", { name: "Notifications" });
    await panel.getByRole("button", { name: "Mark all as read" }).click();
    await expect(panel.getByRole("button", { name: /^Mark (?!all ).+ as read$/ })).toHaveCount(0);
    // On a phone the panel is a modal sheet that hides the header from assistive tech; close it first.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "0 unread notifications" })).toBeVisible();
  });

  test("marks one row read", async ({ page }) => {
    await page.getByRole("button", { name: /unread notification/ }).click();
    const panel = page.getByRole("dialog", { name: "Notifications" });
    const unread = panel.getByRole("button", { name: /^Mark (?!all ).+ as read$/ });
    await expect(unread.first()).toBeVisible();
    const before = await unread.count();
    await unread.first().click();
    await expect(unread).toHaveCount(before - 1);
  });
});

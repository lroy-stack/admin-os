import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The day stepper of the bookings screen (plan 003, B1a, BK8): the business day lives in the URL and each day shows
 * its own bookings. The seeded mock has tonight (Sat, Oct 31, "now" 8:40 PM) and two parties on Mon, Nov 2.
 */

const stepper = (page: Page) => page.getByRole("group", { name: "Change period" });

test.describe("bookings day stepper", () => {
  test.describe.configure({ timeout: 60_000 });

  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("a day in the URL shows that day's bookings in the list", async ({ page }) => {
    await page.goto("/dashboard/bookings?day=2026-11-02");

    await expect(page.getByRole("heading", { level: 2, name: /^Mon, Nov 2/ })).toBeVisible();
    await page.getByRole("radiogroup", { name: "Reservations view" }).getByRole("radio", { name: "List" }).click();
    await expect(page.getByRole("button", { name: "Aranda", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ortega", exact: true })).toHaveCount(0);
  });

  test("Next day moves the URL and the bookings, and Today comes back", async ({ page }) => {
    await page.goto("/dashboard/bookings?day=2026-11-01");
    await expect(page.getByText("No reservations this day")).toBeVisible();

    // Each step is a server navigation (`router.push` in a transition). Wait for the navigation itself, within the
    // test's budget, rather than polling the URL for the 5 s expect default: on a loaded machine the server render of a
    // day can take longer than that, which made this test fail only under load.
    await stepper(page).getByRole("button", { name: "Next day" }).click();
    await page.waitForURL((url) => url.searchParams.get("day") === "2026-11-02");
    await expect(page.getByRole("heading", { level: 2, name: /^Mon, Nov 2/ })).toBeVisible();
    await expect(page.getByText("No reservations this day")).toHaveCount(0);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

    await stepper(page).getByRole("button", { name: "Today" }).click();
    await page.waitForURL((url) => !url.searchParams.has("day"));
    await expect(page.getByRole("heading", { level: 2, name: /^Sat, Oct 31/ })).toBeVisible();
  });

  test("a day without bookings says so and offers the way back to today", async ({ page }) => {
    await page.goto("/dashboard/bookings?day=2026-11-01");

    await expect(page.getByText("No reservations this day")).toBeVisible();
    await page.getByRole("button", { name: "Back to today" }).click();

    await expect(page.getByRole("heading", { level: 2, name: /^Sat, Oct 31/ })).toBeVisible();
  });

  test("a URL that is not a day falls back to today", async ({ page }) => {
    await page.goto("/dashboard/bookings?day=tomorrow");

    await expect(page.getByRole("heading", { level: 2, name: /^Sat, Oct 31/ })).toBeVisible();
  });
});

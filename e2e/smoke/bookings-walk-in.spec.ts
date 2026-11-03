import { expect, type Locator, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The Walk-in window (plan 003, B4, AC3): the header button and a free table's callout open the same window; the
 * party size, a suggested table and Seat are three interactions; a toast offers Undo. The seeded day has "now" at
 * 8:40 PM; a walk-in stays 90 minutes, so a table is suggested only when nothing is booked on it for that long.
 */

const plate = (page: Page, label: string, state: string) =>
  page.getByRole("button", { name: new RegExp(`^${label}, \\d+ seats, ${state}`) });

const undoOf = (page: Page, message: string) =>
  page.locator("[data-sonner-toast]").filter({ hasText: message }).getByRole("button", { name: "Undo" });

const openFromHeader = async (page: Page) => {
  await page.getByRole("button", { name: "Walk-in", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Seat walk-in" });
  await expect(dialog).toBeVisible();
  return dialog;
};

/** Raises the covers by `count`: the stepper takes one tap per guest. */
const addGuests = async (dialog: Locator, count: number) => {
  for (let tap = 0; tap < count; tap += 1) {
    await dialog.getByRole("button", { name: "One guest more" }).click();
  }
};

test.describe("walk-in window", () => {
  test.describe.configure({ timeout: 90_000 });

  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/bookings");
    await expect(plate(page, "S3", "Seated")).toBeVisible({ timeout: 30_000 });
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("seats a party in three steps from the header, and Undo takes it back", async ({ page }) => {
    const dialog = await openFromHeader(page);

    await dialog.getByRole("radio", { name: /^S8/ }).click();
    await dialog.getByRole("button", { name: "Seat 2" }).click();

    await expect(page.getByRole("dialog", { name: "Seat walk-in" })).toHaveCount(0);
    await expect(plate(page, "S8", "Seated")).toBeVisible();

    await undoOf(page, "Walk-in seated at S8").click();

    await expect(plate(page, "S8", "Free")).toBeVisible();
  });

  test("the covers stepper changes the suggested tables", async ({ page }) => {
    const dialog = await openFromHeader(page);
    await expect(dialog.getByRole("radio", { name: /^S8/ })).toBeVisible();

    await dialog.getByRole("button", { name: "One guest more" }).click();

    await expect(dialog.getByRole("radio", { name: /^S8/ })).toHaveCount(0);
    await expect(dialog.getByText("No table is free for 3 guests")).toBeVisible();
  });

  test("seats with a name, and the walk-in is listed under it", async ({ page }) => {
    const dialog = await openFromHeader(page);

    await dialog.getByRole("radio", { name: /^B3/ }).click();
    await dialog.getByLabel("Guest name (optional)").fill("Rey");
    await dialog.getByRole("button", { name: "Seat 2" }).click();
    await expect(plate(page, "B3", "Seated")).toBeVisible();

    await page.getByRole("radiogroup", { name: "Reservations view" }).getByRole("radio", { name: "List" }).click();
    const row = page.getByRole("row", { name: /Rey/ });
    await expect(row.getByRole("cell", { name: "Seated" })).toBeVisible();
  });

  test("a free table's callout opens the same window with the table and the count preset", async ({ page }) => {
    await plate(page, "B2", "Free").click();
    await page.getByRole("dialog").getByRole("button", { name: "Seat 2" }).click();

    const dialog = page.getByRole("dialog", { name: "Seat walk-in" });
    await expect(dialog.getByRole("radio", { name: /^B2/ })).toBeChecked();

    await dialog.getByRole("button", { name: "Seat 2" }).click();

    await expect(plate(page, "B2", "Seated")).toBeVisible();
  });

  test("a table that is free for less than a stay is not offered, and the window says so", async ({ page }) => {
    await plate(page, "S4", "Free").click();
    await page.getByRole("dialog").getByRole("button", { name: "Seat 2" }).click();

    const dialog = page.getByRole("dialog", { name: "Seat walk-in" });
    await expect(dialog.getByText("S4 cannot take this party for a full stay. These tables can.")).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /^S4/ })).toHaveCount(0);
    await expect(dialog.getByRole("radio", { name: /^S8/ })).toBeVisible();
  });

  test("when every table that fits is booked soon it says why and which table frees up first", async ({ page }) => {
    const dialog = await openFromHeader(page);

    await addGuests(dialog, 4);

    await expect(dialog.getByText("No table is free for 6 guests")).toBeVisible();
    await expect(
      dialog.getByText(/No table that seats 6 guests is free for a full stay before \d+:\d+ [AP]M\./),
    ).toBeVisible();
    await expect(dialog.getByText(/S6 frees up first\. Tell the party to expect a wait of about/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^Seat / })).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Close", exact: true }).first()).toBeVisible();
  });

  test("when no table is big enough it names the largest", async ({ page }) => {
    const dialog = await openFromHeader(page);

    await addGuests(dialog, 18);

    await expect(dialog.getByText("No table is free for 20 guests")).toBeVisible();
    await expect(dialog.getByText("No table seats 20 guests. The largest seats 6 seats.")).toBeVisible();
  });

  test("Escape closes the window and returns focus to the Walk-in button", async ({ page }) => {
    await openFromHeader(page);

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog", { name: "Seat walk-in" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Walk-in", exact: true })).toBeFocused();
  });

  test.describe("on a phone", () => {
    test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "A bottom sheet below 768 px");

    test("is a bottom sheet", async ({ page }) => {
      const dialog = await openFromHeader(page);

      await expect
        .poll(async () => {
          const box = await dialog.boundingBox();
          return Math.round((box?.y ?? 0) + (box?.height ?? 0));
        })
        .toBe(page.viewportSize()?.height);
    });
  });

  test.describe("on a desktop", () => {
    test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "A centered dialog from 768 px");

    test("is a centered dialog at most 480 px wide", async ({ page }) => {
      const dialog = await openFromHeader(page);
      const box = await dialog.boundingBox();

      expect(box?.width).toBeLessThanOrEqual(480);
      expect((box?.x ?? 0) + (box?.width ?? 0) / 2).toBeCloseTo(720, -1);
    });
  });
});

test.describe("walk-in window in a fresh browser", () => {
  test.describe.configure({ timeout: 90_000 });

  test("a visitor with no cookies seats a walk-in, which starts the demo session", async ({
    browser,
    baseURL,
  }, info) => {
    const context = await browser.newContext({ baseURL, viewport: info.project.use.viewport ?? null });
    const page = await context.newPage();
    const problems = watch(page);
    await page.goto("/dashboard/bookings");
    await expect(plate(page, "S3", "Seated")).toBeVisible({ timeout: 30_000 });
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("demo_session");

    const dialog = await openFromHeader(page);
    await dialog.getByRole("button", { name: "Seat 2" }).click();

    await expect(page.getByRole("dialog", { name: "Seat walk-in" })).toHaveCount(0);
    await expect.poll(async () => (await context.cookies()).map((cookie) => cookie.name)).toContain("demo_session");
    expect(problems).toEqual([]);
    await context.close();
  });
});

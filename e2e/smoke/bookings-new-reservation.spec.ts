import { expect, type Locator, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The New reservation panel (plan 003, B5, BK2, AC4): the header button opens a nonmodal panel on desktop and a
 * full-screen sheet on a phone; a guest found by name, a day, a party, a time from the availability and Create make one
 * booking that the day lists. The seeded day has "now" at 8:40 PM, Saturday Oct 31.
 */

const openPanel = async (page: Page) => {
  await page.getByRole("button", { name: "New reservation" }).click();
  const panel = page
    .getByRole("region", { name: "New reservation" })
    .or(page.getByRole("dialog", { name: "New reservation" }));
  await expect(panel).toBeVisible();
  return panel;
};

const pickGuest = async (panel: Locator, search: string, name: string) => {
  await panel.getByLabel("Search guests by name or phone").fill(search);
  await panel.getByRole("option", { name }).click();
};

/** Raises the party by `count`: the stepper takes one tap per guest. */
const addGuests = async (panel: Locator, count: number) => {
  for (let tap = 0; tap < count; tap += 1) {
    await panel.getByRole("button", { name: "One guest more" }).click();
  }
};

const toastOf = (page: Page, message: string | RegExp) =>
  page.locator("[data-sonner-toast]").filter({ hasText: message });

const view = (page: Page, name: "Floor" | "Agenda" | "List") =>
  page.getByRole("radiogroup", { name: "Reservations view" }).getByRole("radio", { name });

test.describe("new reservation panel", () => {
  test.describe.configure({ timeout: 90_000 });

  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/bookings");
    await expect(page.getByRole("button", { name: /^S3, \d+ seats/ })).toBeVisible({ timeout: 30_000 });
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("books an existing guest at a time, and the day lists the booking", async ({ page }) => {
    const panel = await openPanel(page);

    await pickGuest(panel, "Ortega", "Ortega +34600000102");
    await panel.getByRole("radio", { name: "9:15 PM" }).click();
    await panel.getByRole("button", { name: "Create reservation" }).click();

    await expect(toastOf(page, "Booked Ortega · 2 guests · 9:15 PM")).toBeVisible();
    await expect(page.getByRole("region", { name: "New reservation" })).toHaveCount(0);
    await view(page, "List").click();
    await expect(page.getByRole("row", { name: /9:15 PM.*Ortega/ })).toBeVisible();
  });

  test("a new contact is created with the booking", async ({ page }) => {
    const panel = await openPanel(page);

    await panel.getByRole("radio", { name: "New contact" }).click();
    await panel.getByLabel("Name").fill("Nadal");
    await panel.getByLabel("Phone").fill("+34 611 000 111");
    await panel.getByRole("radio", { name: "9:30 PM" }).click();
    await panel.getByRole("button", { name: "Create reservation" }).click();

    await expect(toastOf(page, "Booked Nadal · 2 guests · 9:30 PM")).toBeVisible();
    await view(page, "List").click();
    await expect(page.getByRole("row", { name: /9:30 PM.*Nadal/ })).toBeVisible();
  });

  test("a party that no time fits says so and offers no time", async ({ page }) => {
    const panel = await openPanel(page);

    await addGuests(panel, 38);

    await expect(panel.getByText("No time fits 40 guests on this day.")).toBeVisible();
    await expect(panel.getByRole("radio", { name: /PM$/ })).toHaveCount(0);
  });

  test("asks for a guest and a time before it writes", async ({ page }) => {
    const panel = await openPanel(page);

    await panel.getByRole("button", { name: "Create reservation" }).click();

    await expect(panel.getByText("Pick a guest or add a new contact.")).toBeVisible();
    await expect(panel.getByText("Pick a time.")).toBeVisible();
  });

  test("another day offers its own times and the toast offers to show that day", async ({ page }) => {
    const panel = await openPanel(page);

    await panel.getByLabel("Date").fill("2026-11-02");
    await expect(panel.getByRole("radio", { name: "7:00 PM" })).toBeVisible();
    await pickGuest(panel, "Ortega", "Ortega +34600000102");
    await panel.getByRole("radio", { name: "7:00 PM" }).click();
    await panel.getByRole("button", { name: "Create reservation" }).click();

    await toastOf(page, /Booked Ortega · 2 guests · 7:00 PM/)
      .getByRole("button", { name: /^Show / })
      .click();

    await expect(page).toHaveURL(/day=2026-11-02/);
  });

  test("a double submit books once", async ({ page }) => {
    const panel = await openPanel(page);
    await pickGuest(panel, "Ortega", "Ortega +34600000102");
    await panel.getByRole("radio", { name: "10:00 PM" }).click();

    await panel.getByRole("button", { name: "Create reservation" }).dblclick();

    await expect(toastOf(page, "Booked Ortega · 2 guests · 10:00 PM")).toHaveCount(1);
    await view(page, "List").click();
    await expect(page.getByRole("row", { name: /10:00 PM.*Ortega/ })).toHaveCount(1);
  });

  test("Escape closes a clean panel and returns focus to the button", async ({ page }) => {
    await openPanel(page);

    await page.keyboard.press("Escape");

    await expect(page.getByRole("region", { name: "New reservation" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "New reservation" })).toBeFocused();
  });

  test("a panel with typed changes asks before it closes", async ({ page }) => {
    const panel = await openPanel(page);
    await panel.getByLabel("Note").fill("Window seat");

    await page.keyboard.press("Escape");

    await expect(page.getByRole("alertdialog")).toBeVisible();
  });
});

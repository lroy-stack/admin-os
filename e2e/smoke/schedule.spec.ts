import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The Schedule (plan 003, M5) on demo-local state: Add event, the event's details with Edit and Delete, the calendar
 * filter, and the shortcuts in the sidebar. The wording is the `en` dictionary. The new event sits on the 20th of the
 * current month, a day the demo events leave free, so the test reads the device's clock only to name that day.
 */

const TITLE = "Quay inspection";
const now = new Date();
const pad = (value: number) => String(value).padStart(2, "0");
const DAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-20`;
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
const TOMORROW = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

const calendar = (page: Page) => page.getByRole("main");
const eventBlock = (page: Page, title: string) => calendar(page).getByText(title).first();

async function addEvent(page: Page, title: string, calendarName = "Work", day = DAY) {
  await page.getByRole("button", { name: "Add event" }).click();
  const dialog = page.getByRole("dialog", { name: "New event" });
  await expect(dialog.getByText("Demo data, not saved")).toBeVisible();
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Calendar").selectOption({ label: calendarName });
  await dialog.getByLabel("Start date").fill(day);
  await dialog.getByLabel("Start time").fill("09:00");
  await dialog.getByLabel("End date").fill(day);
  await dialog.getByLabel("End time").fill("10:30");
  await dialog.getByLabel("Location").fill("Harbour office");
  await dialog.getByRole("button", { name: "Create event" }).click();
  await expect(dialog).toBeHidden();
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
});

test.describe("schedule", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page }) => {
    problems = watch(page);
    await page.goto("/dashboard/calendar");
    await expect(page.getByRole("button", { name: "Add event" })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("Add event creates an event that shows on the calendar", async ({ page }) => {
    await addEvent(page, TITLE);

    await expect(eventBlock(page, TITLE)).toBeVisible();
    await expect(page.getByRole("button", { name: "Add event" })).toBeFocused();
  });

  test("an empty New event form names what is missing and keeps the window open", async ({ page }) => {
    await page.getByRole("button", { name: "Add event" }).click();
    const dialog = page.getByRole("dialog", { name: "New event" });

    await dialog.getByLabel("Start date").fill("");
    await dialog.getByRole("button", { name: "Create event" }).click();

    await expect(dialog.getByText("Enter a title.")).toBeVisible();
    await expect(dialog.getByText("Enter a valid date.")).toBeVisible();
  });

  test("an end before the start is refused", async ({ page }) => {
    await page.getByRole("button", { name: "Add event" }).click();
    const dialog = page.getByRole("dialog", { name: "New event" });

    await dialog.getByLabel("Title").fill(TITLE);
    await dialog.getByLabel("Start time").fill("10:00");
    await dialog.getByLabel("End date").fill(await dialog.getByLabel("Start date").inputValue());
    await dialog.getByLabel("End time").fill("09:00");
    await dialog.getByRole("button", { name: "Create event" }).click();

    await expect(dialog.getByText("The end must come after the start.")).toBeVisible();
  });

  test("an event opens its details, then Edit changes it", async ({ page }) => {
    await addEvent(page, TITLE);

    await eventBlock(page, TITLE).click();
    const details = page.getByRole("dialog", { name: TITLE });
    await expect(details.getByText("Harbour office")).toBeVisible();

    await details.getByRole("button", { name: "Edit event" }).click();
    const form = page.getByRole("dialog", { name: "Edit event" });
    await form.getByLabel("Title").fill("Quay inspection, moved");
    await form.getByRole("button", { name: "Save event" }).click();

    await expect(eventBlock(page, "Quay inspection, moved")).toBeVisible();
  });

  test("Delete asks first, removes the event and offers undo", async ({ page }) => {
    await addEvent(page, TITLE);

    await eventBlock(page, TITLE).click();
    await page.getByRole("dialog", { name: TITLE }).getByRole("button", { name: "Delete event" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete event" }).click();
    await expect(calendar(page).getByText(TITLE)).toHaveCount(0);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(eventBlock(page, TITLE)).toBeVisible();
  });

  test("the calendar filter shows only the events of one calendar", async ({ page }) => {
    await addEvent(page, TITLE, "Work");

    await page.getByRole("combobox", { name: "Calendar" }).click();
    await page.getByRole("option", { name: "Personal" }).click();
    await expect(calendar(page).getByText(TITLE)).toHaveCount(0);

    await page.getByRole("combobox", { name: "Calendar" }).click();
    await page.getByRole("option", { name: "Work" }).click();
    await expect(eventBlock(page, TITLE)).toBeVisible();
  });

  test("dragging over days opens New event on that range, and dragging an event reschedules it with undo", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "375", "the pointer gestures need the room of a desktop calendar");
    const cell = async (day: number) => {
      const box = await page
        .locator(`[data-date$="-${pad(day)}"]`)
        .first()
        .boundingBox();
      if (!box) throw new Error(`day ${day} is not on the calendar`);
      return box;
    };
    const from = await cell(20);
    const to = await cell(22);
    await page.mouse.move(from.x + 20, from.y + 40);
    await page.mouse.down();
    await page.mouse.move(to.x + 20, to.y + 40, { steps: 10 });
    await page.mouse.up();

    const dialog = page.getByRole("dialog", { name: "New event" });
    await expect(dialog.getByLabel("Start date")).toHaveValue(DAY);
    await expect(dialog.getByLabel("End date")).toHaveValue(DAY.replace("-20", "-22"));
    await expect(dialog.getByLabel("All day")).toBeChecked();
    await dialog.getByLabel("Title").fill(TITLE);
    await dialog.getByRole("button", { name: "Create event" }).click();
    await expect(dialog).toBeHidden();

    const block = await eventBlock(page, TITLE).boundingBox();
    const target = await cell(26);
    if (!block) throw new Error("the new event is not on the calendar");
    await page.mouse.move(block.x + 10, block.y + block.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + 30, target.y + 40, { steps: 15 });
    await page.mouse.up();

    await expect(page.locator("[data-sonner-toast]", { hasText: `${TITLE} rescheduled` })).toBeVisible();
    await page
      .locator("[data-sonner-toast]", { hasText: `${TITLE} rescheduled` })
      .getByRole("button", { name: "Undo" })
      .click();
    await eventBlock(page, TITLE).click();
    await expect(page.getByRole("dialog", { name: TITLE }).getByText(/20/)).toBeVisible();
  });

  test("an item of Up next opens the event's details", async ({ page }) => {
    await addEvent(page, TITLE, "Work", TOMORROW);

    await page.locator("button[data-slot=item]").filter({ hasText: TITLE }).click();

    await expect(page.getByRole("dialog", { name: TITLE })).toBeVisible();
  });

  test("a closing deal links to the pipeline", async ({ page }) => {
    const deal = page
      .getByRole("link")
      .filter({ has: page.locator("[data-slot=item-title]") })
      .first();

    await expect(deal).toHaveAttribute("href", "/dashboard/crm");
  });
});

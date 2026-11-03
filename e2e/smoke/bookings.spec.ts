import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * Characterization of the bookings screen (plan 003, B0): what the floor, rail, list, agenda, drawer, room editor
 * and full view do today, pinned at 375 and 1440 px before the screen moves onto the data seam. The refactor must
 * keep every test green without editing it. The wording is the `en` dictionary of the screen and the data is the
 * seeded mock service ("now" is 8:40 PM, Saturday Oct 31), so nothing here depends on the clock or on chance.
 *
 * Not pinned on purpose: the day stepper on other days (a known bug), Walk-in and New reservation (not wired yet).
 */

/** A table plate of the floor by its label, whatever its state reading says after it. */
const plate = (page: Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label}, \\d+ seats`) });

/** One of the Floor / Agenda / List radios. */
const view = (page: Page, name: "Floor" | "Agenda" | "List") =>
  page.getByRole("radiogroup", { name: "Reservations view" }).getByRole("radio", { name });

const editRoom = async (page: Page) => {
  await page.getByRole("button", { name: "Service tools" }).click();
  await page.getByRole("menuitem", { name: "Edit room" }).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
};

test.describe("bookings screen", () => {
  test.describe.configure({ timeout: 60_000 });

  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/bookings");
    // The room loads lazily (a WebGL engine in its own chunk): a table plate on screen means the page is hydrated and
    // interactive. The wait is generous because a loaded CI machine renders the scene in software.
    await expect(plate(page, "S3")).toBeVisible({ timeout: 30_000 });
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("the header shows today's service numbers", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Today’s Reservations" })).toBeVisible();
    await expect(page.getByText("17/59", { exact: true })).toBeVisible();
    await expect(page.getByText("Guests seated · seats", { exact: true })).toBeVisible();
    await expect(page.getByText("Next: Peña · 2p", { exact: true })).toBeVisible();
    await expect(page.getByText("Tables free right now", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /^Sat, Oct 31/ })).toBeVisible();
  });

  test.describe("views", () => {
    test("Floor is the starting view", async ({ page }) => {
      await expect(view(page, "Floor")).toBeChecked();
      await expect(plate(page, "S3")).toBeVisible();
    });

    test("Agenda shows one bar per reservation and leaves the floor", async ({ page }) => {
      await view(page, "Agenda").click();

      await expect(view(page, "Agenda")).toBeChecked();
      await expect(page.getByRole("button", { name: "Ortega · 4p" })).toBeAttached();
      await expect(plate(page, "S3")).toHaveCount(0);
    });

    test("List shows the reservations as a table and leaves the floor", async ({ page }) => {
      await view(page, "List").click();

      await expect(view(page, "List")).toBeChecked();
      await expect(page.getByRole("columnheader", { name: "Guest" })).toBeVisible();
      await expect(page.getByRole("row", { name: /Ortega/ })).toBeVisible();
      await expect(plate(page, "S3")).toHaveCount(0);
    });

    test("Floor comes back after the other views", async ({ page }) => {
      await view(page, "List").click();
      await view(page, "Floor").click();

      await expect(view(page, "Floor")).toBeChecked();
      await expect(plate(page, "S3")).toBeVisible();
    });
  });

  test.describe("floor", () => {
    // Street level at 8:40 PM: each table by its accessible name (label, seats, state and reading).
    const STREET_TABLES = [
      "S1, 4 seats, Arriving. Arrives 9:00 PM",
      "S2, 2 seats, Leaving soon. Over by 10 min",
      "S3, 4 seats, Seated. Leaves in 20 min",
      "S4, 2 seats, Free. Free for 50 min",
      "S5, 4 seats, Late. Late 10 min",
      "S6, 6 seats, Arriving. Arrives 9:00 PM",
      "S7, 4 seats, Arriving. Arrives 8:45 PM",
      "S8, 2 seats, Free. Free tonight",
      "B1, 2 seats, Arriving. Arrives 8:45 PM",
      "B2, 2 seats, Free. Free tonight",
      "B3, 2 seats, Free. Free tonight",
      "B4, 2 seats, Free. Free tonight",
    ];

    for (const name of STREET_TABLES) {
      test(`lists the table "${name}"`, async ({ page }) => {
        await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
      });
    }

    test("the Rooftop level swaps the tables of the street level for its own", async ({ page }) => {
      await page.getByRole("radio", { name: /^Rooftop/ }).click();

      await expect(page.getByRole("radio", { name: /^Rooftop/ })).toBeChecked();
      await expect(plate(page, "T8")).toBeVisible();
      await expect(plate(page, "S3")).toHaveCount(0);
    });

    test("2.5D is the starting camera angle", async ({ page }) => {
      await expect(page.getByRole("radio", { name: "2.5D" })).toBeChecked();
    });

    test("the 2D camera angle can be selected", async ({ page }) => {
      await page.getByRole("radio", { name: "2D" }).click();

      await expect(page.getByRole("radio", { name: "2D" })).toBeChecked();
      await expect(page.getByRole("radio", { name: "2.5D" })).not.toBeChecked();
    });

    test("the 3D camera angle can be selected", async ({ page }) => {
      await page.getByRole("radio", { name: "3D" }).click();

      await expect(page.getByRole("radio", { name: "3D" })).toBeChecked();
      await expect(page.getByRole("radio", { name: "2.5D" })).not.toBeChecked();
    });

    test("the 2.5D camera angle can be selected again", async ({ page }) => {
      await page.getByRole("radio", { name: "2D" }).click();
      await page.getByRole("radio", { name: "2.5D" }).click();

      await expect(page.getByRole("radio", { name: "2.5D" })).toBeChecked();
      await expect(page.getByRole("radio", { name: "2D" })).not.toBeChecked();
    });
  });

  test.describe("table callout", () => {
    test("a seated table opens its callout with the guest and the next step", async ({ page }) => {
      await plate(page, "S3").click();

      const callout = page.getByRole("dialog");
      await expect(callout.getByText("4 seats · Dining room")).toBeVisible();
      await expect(callout.getByText("Ortega")).toBeVisible();
      await expect(callout.getByRole("button", { name: "Complete" })).toBeVisible();
      await expect(callout.getByRole("button", { name: "Details" })).toBeVisible();
    });

    test("a free table opens its callout offering to seat a walk-in", async ({ page }) => {
      await plate(page, "S4").click();

      const callout = page.getByRole("dialog");
      await expect(callout.getByText("Free for 50 min")).toBeVisible();
      await expect(callout.getByRole("button", { name: "Seat 2" })).toBeVisible();
    });

    test("Details in the callout opens the reservation", async ({ page }) => {
      await plate(page, "S3").click();
      await page.getByRole("dialog").getByRole("button", { name: "Details" }).click();

      await expect(page.getByRole("dialog", { name: "Ortega" })).toBeVisible();
    });

    test("the callout's main action seats a confirmed party", async ({ page }) => {
      await plate(page, "S5").click();
      const callout = page.getByRole("dialog");
      await expect(callout.getByRole("button", { name: "Seat at S5" })).toBeVisible();

      await callout.getByRole("button", { name: "Seat at S5" }).click();

      await expect(callout.getByRole("button", { name: "Complete" })).toBeVisible();
      await expect(callout.getByRole("button", { name: "Seat at S5" })).toHaveCount(0);
    });
  });

  test.describe("reservation details", () => {
    test("a reservation opens its details from the list", async ({ page }) => {
      await view(page, "List").click();
      await page.getByRole("button", { name: "Ortega", exact: true }).click();

      const details = page.getByRole("dialog", { name: "Ortega" });
      await expect(details.getByText("4 guests · 7:15 PM–9:00 PM · Phone")).toBeVisible();
      await expect(details.getByText("Table S3")).toBeVisible();
      await expect(details.getByRole("region", { name: "Guest" })).toBeVisible();
      await expect(details.getByRole("region", { name: "Details" })).toBeVisible();
      await expect(details.getByText("One guest is coeliac")).toBeVisible();
    });

    test("a reservation opens its details from the agenda", async ({ page }) => {
      await view(page, "Agenda").click();
      await page.getByRole("button", { name: "Ortega · 4p" }).click();

      const details = page.getByRole("dialog", { name: "Ortega" });
      await expect(details.getByText("4 guests · 7:15 PM–9:00 PM · Phone")).toBeVisible();
      await expect(details.getByText("Table S3")).toBeVisible();
    });

    test("the details close with Escape", async ({ page }) => {
      await view(page, "List").click();
      await page.getByRole("button", { name: "Ortega", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Ortega" })).toBeVisible();

      await page.keyboard.press("Escape");

      await expect(page.getByRole("dialog", { name: "Ortega" })).toHaveCount(0);
    });

    test("the details' main action seats a confirmed party", async ({ page }) => {
      await view(page, "List").click();
      await page.getByRole("button", { name: "Castaño", exact: true }).click();
      const details = page.getByRole("dialog", { name: "Castaño" });
      await expect(details.getByText("Confirmed")).toBeVisible();

      await details.getByRole("button", { name: "Seat at T8" }).click();

      await expect(details.getByText("Seated", { exact: true })).toBeVisible();
      await expect(details.getByRole("button", { name: "Complete" })).toBeVisible();
    });
  });

  test.describe("list actions", () => {
    test("Seat advances a confirmed reservation to seated", async ({ page }) => {
      await view(page, "List").click();
      const row = page.getByRole("row", { name: /Castaño/ });
      await expect(row.getByRole("cell", { name: "Confirmed" })).toBeVisible();

      await row.getByRole("button", { name: "Seat at T8" }).click();

      await expect(row.getByRole("cell", { name: "Seated" })).toBeVisible();
      await expect(row.getByRole("button", { name: "Complete" })).toBeVisible();
    });

    test("Confirm advances a pending reservation to confirmed", async ({ page }) => {
      await view(page, "List").click();
      const row = page.getByRole("row", { name: /Marín/ });
      await expect(row.getByRole("cell", { name: "To confirm" })).toBeVisible();

      await row.getByRole("button", { name: "Confirm" }).click();

      await expect(row.getByRole("cell", { name: "Confirmed" })).toBeVisible();
      await expect(row.getByRole("button", { name: "Seat at S4" })).toBeVisible();
    });

    test("the action does not also open the reservation", async ({ page }) => {
      await view(page, "List").click();
      await page
        .getByRole("row", { name: /Castaño/ })
        .getByRole("button", { name: "Seat at T8" })
        .click();

      await expect(page.getByRole("dialog")).toHaveCount(0);
    });
  });

  test.describe("arrivals rail", () => {
    test.describe("beside the room", () => {
      test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "The rail is a column only from the tablet width up");

      test("shows the arrivals by time slot, starting at now", async ({ page }) => {
        await expect(page.getByText("8:30 PM · 1 arrival · 38 free", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: /^8:30 PM Now 1 arrival · 4 guests/ })).toBeVisible();
        await expect(page.getByRole("button", { name: /^9:00 PM 4 arrivals · 14 guests/ })).toBeVisible();
        await expect(page.getByRole("button", { name: /^9:45 PM No arrivals/ })).toBeVisible();
      });

      test("an arrival lists under its slot", async ({ page }) => {
        await expect(page.getByRole("button", { name: /^4 Bravo 8:30 PM \+10 min/ })).toBeVisible();
      });

      test("choosing an arrival focuses its table and opens the callout", async ({ page }) => {
        await page.getByRole("button", { name: /^2 Castaño 8:15 PM/ }).click();

        await expect(page.getByRole("button", { name: /^2 Castaño 8:15 PM/ })).toHaveAttribute("aria-pressed", "true");
        await expect(plate(page, "T8")).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByRole("dialog").getByRole("button", { name: "Seat at T8" })).toBeVisible();
      });

      test("the rail folds to a strip and unfolds again", async ({ page }) => {
        await page.getByRole("button", { name: "Fold arrivals" }).click();

        await expect(page.getByRole("button", { name: "Fold arrivals" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: /^8:30 PM Now/ })).toHaveCount(0);

        await page.getByRole("button", { name: "Show arrivals" }).click();

        await expect(page.getByRole("button", { name: /^8:30 PM Now 1 arrival · 4 guests/ })).toBeVisible();
      });
    });

    test.describe("in the arrivals drawer", () => {
      test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "Phones reach the rail through the Arrivals button");

      test("the Arrivals button opens the slots", async ({ page }) => {
        await page.getByRole("button", { name: "Arrivals", exact: true }).click();

        const drawer = page.getByRole("dialog", { name: "Arrivals" });
        await expect(drawer.getByRole("button", { name: /^8:30 PM Now 1 arrival · 4 guests/ })).toBeVisible();
        await expect(drawer.getByRole("button", { name: /^9:00 PM 4 arrivals · 14 guests/ })).toBeVisible();
        await expect(drawer.getByRole("button", { name: /^9:45 PM No arrivals/ })).toBeVisible();
      });

      test("choosing an arrival closes the drawer and opens its table's callout", async ({ page }) => {
        await page.getByRole("button", { name: "Arrivals", exact: true }).click();
        await page
          .getByRole("dialog", { name: "Arrivals" })
          .getByRole("button", { name: /^2 Castaño 8:15 PM/ })
          .click();

        await expect(page.getByRole("dialog", { name: "Arrivals" })).toHaveCount(0);
        await expect(page.getByRole("dialog", { name: "Table T8" })).toBeVisible();
      });
    });
  });

  test.describe("room editor", () => {
    test("Service tools → Edit room enters the editor, and Done leaves it", async ({ page }) => {
      await editRoom(page);

      await expect(page.getByText("Editing Street level")).toBeVisible();
      await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
      // Editing names a table by label and seats only: the service state is not shown.
      await expect(page.getByRole("button", { name: "S3, 4 seats", exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Done" }).click();

      await expect(page.getByText("Editing Street level")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Done" })).toHaveCount(0);
      await expect(plate(page, "S3")).toBeVisible();
      await expect(page.getByRole("button", { name: "S3, 4 seats", exact: true })).toHaveCount(0);
    });

    for (const name of ["Table", "Element", "Zone", "Level"]) {
      test(`the editor offers to add a ${name.toLowerCase()}`, async ({ page }) => {
        await editRoom(page);

        await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
      });
    }

    test("selecting a table in the editor shows its properties", async ({ page }) => {
      await editRoom(page);
      await page.getByRole("button", { name: "S3, 4 seats", exact: true }).click();

      await expect(page.getByRole("textbox", { name: "Label" })).toHaveValue("S3");
      await expect(page.getByRole("spinbutton", { name: "Seats (size follows)" })).toHaveValue("4");
      await expect(page.getByRole("button", { name: "Duplicate" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    });
  });

  test.describe("full view", () => {
    // The toggle is found by its label, not its role: on a phone the open arrivals sheet hides the rest of the page
    // from the accessibility tree while it is up.
    const toggle = (page: Page) => page.getByLabel("Full view", { exact: true });
    const fullViewRegion = (page: Page) => page.getByRole("region", { name: "Reservations, full view" });

    test("Full view lifts the reservations into their own region", async ({ page }) => {
      await expect(fullViewRegion(page)).toHaveCount(0);

      await toggle(page).click();

      await expect(fullViewRegion(page)).toBeVisible();
      await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    });

    test("the toggle leaves the full view too", async ({ page }) => {
      await toggle(page).click();
      await expect(fullViewRegion(page)).toBeVisible();

      await toggle(page).click();

      await expect(fullViewRegion(page)).toHaveCount(0);
      await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    });

    test.describe("with a keyboard", () => {
      test.skip(
        ({ viewport }) => (viewport?.width ?? 0) < 768,
        "On a phone the open arrivals sheet takes Escape and hides the controls from the accessibility tree",
      );

      test("Escape leaves the full view", async ({ page }) => {
        await toggle(page).click();
        await expect(fullViewRegion(page)).toBeVisible();

        // Move the pointer off the toggle so its tooltip does not take the first Escape.
        await page.mouse.move(0, 0);
        await page.keyboard.press("Escape");

        await expect(fullViewRegion(page)).toHaveCount(0);
        await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
      });

      test("the views keep switching inside the full view", async ({ page }) => {
        await toggle(page).click();
        await view(page, "List").click();

        await expect(page.getByRole("row", { name: /Ortega/ })).toBeVisible();
      });
    });
  });
});

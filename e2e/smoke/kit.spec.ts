import { expect, type Page, test } from "@playwright/test";

/**
 * The window kit (spec 003, K1 to K3) in a real browser, once per viewport project: the right container for the
 * viewport, focus inside on open and back on the opener on Escape, ConfirmAction's guarantees and the unsaved-changes
 * question. The kit page keeps all its state local and says so in each window.
 */

const SCREEN = {
  "375": {
    width: 375,
    height: 812,
    panel: "bottom",
    sheets: 1,
    quickMaxWidth: 375,
    formMaxWidth: 375,
    formMinHeight: 812,
  },
  "1440": {
    width: 1440,
    height: 900,
    panel: "right",
    sheets: 0,
    quickMaxWidth: 480,
    formMaxWidth: 640,
    formMinHeight: 0,
  },
} as const;

/** The index of the current history entry: waits for a Stay's traversal back to the guarded entry to finish. */
const historyIndex = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { navigation: { currentEntry: { index: number } } }).navigation.currentEntry.index,
  );

test.beforeEach(async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
  await page.goto("/dashboard/kit");
});

const focusIsInside = (dialog: ReturnType<Page["getByRole"]>) =>
  dialog.evaluate((element) => element.contains(document.activeElement));

test("the record panel is a side sheet or a bottom drawer by viewport", async ({ page }, testInfo) => {
  const expected = SCREEN[testInfo.project.name as keyof typeof SCREEN];
  const opener = page.getByRole("button", { name: "Open record" });

  await opener.click();

  const panel = page.getByRole("dialog", { name: "Table 12" });
  await expect(panel).toHaveAttribute("data-vaul-drawer-direction", expected.panel);
  await expect.poll(() => focusIsInside(panel)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(opener).toBeFocused();
});

test("the quick dialog is centered at most 480 px wide, or a bottom sheet on phones", async ({ page }, testInfo) => {
  const expected = SCREEN[testInfo.project.name as keyof typeof SCREEN];
  const opener = page.getByRole("button", { name: "Seat walk-in" });

  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Seat walk-in" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("[data-window=quick][data-vaul-drawer-direction=bottom]")).toHaveCount(expected.sheets);
  await expect.poll(async () => (await dialog.boundingBox())?.width).toBeLessThanOrEqual(expected.quickMaxWidth);
  await expect.poll(async () => (await dialog.boundingBox())?.height).toBeLessThan(expected.height);
  await expect(dialog.getByLabel("Name")).toBeFocused();
  await expect(dialog.getByText("Demo data, not saved")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("the form dialog is centered at most 640 px wide, or a full-screen sheet on phones", async ({
  page,
}, testInfo) => {
  const expected = SCREEN[testInfo.project.name as keyof typeof SCREEN];
  const opener = page.getByRole("button", { name: "Add guest" });

  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Add guest" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("[data-window=form][data-vaul-drawer-direction=bottom]")).toHaveCount(expected.sheets);
  await expect.poll(async () => (await dialog.boundingBox())?.width).toBeLessThanOrEqual(expected.formMaxWidth);
  await expect.poll(async () => (await dialog.boundingBox())?.height).toBeGreaterThanOrEqual(expected.formMinHeight);
  await expect(dialog.getByLabel("Name")).toBeFocused();
  await expect(dialog.getByText("Demo data, not saved")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("a window has one scroll container, its body", async ({ page }) => {
  await page.getByRole("button", { name: "Add guest" }).click();

  const dialog = page.getByRole("dialog", { name: "Add guest" });
  const scrollers = await dialog.evaluate(
    (root) =>
      [root, ...root.querySelectorAll("*:not(textarea)")].filter((element) => {
        const overflow = getComputedStyle(element).overflowY;
        return overflow === "auto" || overflow === "scroll";
      }).length,
  );
  expect(scrollers).toBe(1);
});

test.describe("ConfirmAction", () => {
  const confirmed = (page: Page) => page.getByTestId("confirmed-count");

  test("keeps Cancel focused and ignores Enter on open", async ({ page }) => {
    const opener = page.getByRole("button", { name: "Release table" });
    await opener.click();

    const dialog = page.getByRole("alertdialog", { name: "Release table 12?" });
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(dialog).toBeHidden();
    await expect(confirmed(page)).toHaveText("Confirmed 0 times");
    await expect(opener).toBeFocused();
  });

  test("refuses to confirm until the declared reason is valid", async ({ page }) => {
    await page.getByRole("button", { name: "Cancel reservation" }).click();

    const dialog = page.getByRole("alertdialog", { name: "Cancel this reservation?" });
    const confirm = dialog.getByRole("button", { name: "Cancel reservation" });
    await expect(confirm).toBeDisabled();

    await dialog.getByLabel("Reason").fill("ab");

    await expect(confirm).toBeDisabled();
    await expect(dialog.getByText("Write at least 3 characters.")).toBeVisible();

    await dialog.getByLabel("Reason").fill("guest called");

    await expect(confirm).toBeEnabled();
  });

  test("never confirms twice and closes when the action finishes", async ({ page }) => {
    await page.getByRole("button", { name: "Release table" }).click();

    const dialog = page.getByRole("alertdialog", { name: "Release table 12?" });
    await dialog.getByRole("button", { name: "Release table" }).dblclick();

    await expect(dialog).toBeHidden();
    await expect(confirmed(page)).toHaveText("Confirmed 1 time");
  });

  test("keeps the window open with the text when the action fails", async ({ page }) => {
    await page.getByRole("button", { name: "Delete zone" }).click();

    const dialog = page.getByRole("alertdialog", { name: "Delete the terrace zone?" });
    await dialog.getByRole("button", { name: "Delete zone" }).click();

    await expect(dialog.getByRole("alert")).toHaveText("The zone still has open orders.");
    await expect(dialog).toBeVisible();
  });

  test("returns focus to its trigger on Escape", async ({ page }) => {
    const opener = page.getByRole("button", { name: "Delete zone" });
    await opener.click();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(opener).toBeFocused();
  });
});

test.describe("unsaved changes", () => {
  test("a dirty form asks before closing and keeps the data on Keep editing", async ({ page }) => {
    await page.getByRole("button", { name: "Add guest" }).click();
    const dialog = page.getByRole("dialog", { name: "Add guest" });
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await page.keyboard.press("Escape");

    const question = page.getByRole("alertdialog", { name: "Discard changes?" });
    await expect(question).toBeVisible();
    await question.getByRole("button", { name: "Keep editing" }).click();
    await expect(question).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Name")).toHaveValue("Ana Ruiz");
  });

  test("Discard closes the window and returns focus to its opener", async ({ page }) => {
    const opener = page.getByRole("button", { name: "Add guest" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Add guest" });
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("alertdialog", { name: "Discard changes?" }).getByRole("button", { name: "Discard" }).click();

    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("a dirty quick dialog ignores a click on the backdrop", async ({ page }) => {
    await page.getByRole("button", { name: "Seat walk-in" }).click();
    const dialog = page.getByRole("dialog", { name: "Seat walk-in" });
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await page.mouse.click(2, 2);

    await expect(dialog).toBeVisible();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });
});

test.describe("window rules", () => {
  test("the close button of a dirty form asks before discarding", async ({ page }) => {
    await page.getByRole("button", { name: "Add guest" }).click();
    const dialog = page.getByRole("dialog", { name: "Add guest" });
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await dialog.getByRole("button", { name: "Close" }).click();

    await expect(page.getByRole("alertdialog", { name: "Discard changes?" })).toBeVisible();
    await expect(page.locator("[data-window=form]")).toHaveCount(1);
  });

  test("Keep editing returns focus to the field that was being edited", async ({ page }) => {
    await page.getByRole("button", { name: "Add guest" }).click();
    const dialog = page.getByRole("dialog", { name: "Add guest" });
    await dialog.getByLabel("Email").fill("ana@example.com");

    await page.keyboard.press("Escape");
    await page
      .getByRole("alertdialog", { name: "Discard changes?" })
      .getByRole("button", { name: "Keep editing" })
      .click();

    await expect(dialog.getByLabel("Email")).toBeFocused();
  });

  test("at exactly 768 px the dialog is centered, not a sheet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });

    await page.getByRole("button", { name: "Add guest" }).click();

    const dialog = page.getByRole("dialog", { name: "Add guest" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("[data-window=form][data-vaul-drawer-direction=bottom]")).toHaveCount(0);
    await expect.poll(async () => (await dialog.boundingBox())?.width).toBeLessThanOrEqual(640);
    await expect.poll(async () => (await dialog.boundingBox())?.height).toBeLessThan(900);
  });

  test("an open window survives crossing 768 px and still asks before closing", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: "Add guest" }).click();
    const dialog = page.getByRole("dialog", { name: "Add guest" });
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await page.setViewportSize({ width: 1440, height: 900 });

    await expect(dialog.getByLabel("Name")).toHaveValue("Ana Ruiz");
    await expect(dialog.getByLabel("Name")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog", { name: "Discard changes?" })).toBeVisible();
  });

  test("a confirmation opened from a menu item returns focus to the menu trigger", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Actions for table 12" });
    await trigger.click();
    await page.getByRole("menuitem", { name: "Release table 12" }).click();

    const dialog = page.getByRole("alertdialog", { name: "Release table 12?" });
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("form stack", () => {
  const open = async (page: Page) => {
    await page.getByRole("button", { name: "Add guest" }).click();
    return page.getByRole("dialog", { name: "Add guest" });
  };
  const outcome = (dialog: ReturnType<Page["getByRole"]>, label: string) =>
    dialog.getByLabel("Server answer (demo)").selectOption({ label });

  test("a server invalid lands on its field and focuses it", async ({ page }) => {
    const dialog = await open(page);
    await outcome(dialog, "Email already taken");
    await dialog.getByLabel("Name").fill("Ana Ruiz");
    await dialog.getByLabel("Email").fill("ana@example.com");

    await dialog.getByLabel("Name").press("Enter");

    await expect(dialog.getByText("This email is already in the guest book.")).toBeVisible();
    await expect(dialog.getByLabel("Email")).toBeFocused();
    await expect(dialog.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog).toBeVisible();
  });

  test("the schema refuses an empty name before anything is sent", async ({ page }) => {
    const dialog = await open(page);

    await dialog.getByLabel("Email").press("Enter");

    await expect(dialog.getByText("Enter the guest’s name.")).toBeVisible();
    await expect(dialog.getByLabel("Name")).toBeFocused();
    await expect(page.getByTestId("kit-attempts")).toHaveCount(0);
  });

  test("a second submit while the first is pending does nothing", async ({ page }) => {
    const dialog = await open(page);
    await outcome(dialog, "Server error");
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await dialog.getByLabel("Name").press("Enter");
    await expect(dialog.getByRole("button", { name: "Add guest" })).toHaveAttribute("data-pending", "true");
    await dialog.getByLabel("Name").press("Enter");
    await dialog.getByLabel("Name").press("Enter");

    await expect(dialog.getByText("The guest book could not be reached. Try again.")).toBeVisible();
    await expect(page.getByTestId("kit-attempts")).toHaveText("Submits received: 1");
  });

  test("a server error shows its text above the footer buttons and keeps the window open", async ({ page }) => {
    const dialog = await open(page);
    await outcome(dialog, "Server error");
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await dialog.getByRole("button", { name: "Add guest" }).click();

    const message = dialog.getByText("The guest book could not be reached. Try again.");
    await expect(message).toBeVisible();
    const messageBox = await message.boundingBox();
    const buttonBox = await dialog.getByRole("button", { name: "Add guest" }).boundingBox();
    expect(messageBox?.y ?? 0).toBeLessThan(buttonBox?.y ?? 0);
    await expect(dialog).toBeVisible();
  });

  test("awaiting approval shows the notice and holds the form read-only", async ({ page }) => {
    const dialog = await open(page);
    await outcome(dialog, "Needs approval");
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await dialog.getByLabel("Name").press("Enter");

    await expect(dialog.getByText("Add guest is waiting for approval from the manager role.")).toBeVisible();
    await expect(dialog.getByLabel("Name")).toHaveAttribute("readonly", "");
    await expect(dialog.getByRole("button", { name: "Add guest" })).toHaveAttribute("aria-disabled", "true");
  });

  test("ok closes the window, reports the guest and returns focus to the opener", async ({ page }) => {
    const opener = page.getByRole("button", { name: "Add guest" });
    const dialog = await open(page);
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await dialog.getByLabel("Name").press("Enter");

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Submitted: Ana Ruiz")).toBeVisible();
    await expect(opener).toBeFocused();
  });
});

test.describe("popover or sheet", () => {
  test("is a popover beside its button from 768 px and a bottom sheet below, with focus in and back", async ({
    page,
  }, testInfo) => {
    const expected = SCREEN[testInfo.project.name as keyof typeof SCREEN];
    const trigger = page.getByRole("button", { name: "Filter reservations", includeHidden: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await trigger.click();

    const panel = page.getByRole("dialog", { name: "Filter reservations" });
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-window=popover-or-sheet]")).toHaveCount(expected.sheets);
    await expect.poll(() => focusIsInside(panel)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("a choice applies and closes the panel", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Filter reservations", includeHidden: true });
    await trigger.click();

    await page.getByRole("dialog", { name: "Filter reservations" }).getByRole("button", { name: "Waiting" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("kit-status")).toHaveText("Showing: Waiting");
    await expect(trigger).toBeFocused();
  });
});

test.describe("guarded exit", () => {
  const away = "/dashboard/default";
  const note = (page: Page) => page.getByLabel("Note", { exact: true });
  const question = (page: Page) => page.getByRole("alertdialog", { name: "Discard changes?" });
  const link = (page: Page) => page.getByRole("link", { name: "Go to the dashboard" });

  test("a dirty page asks before an in-app link, and Keep editing keeps the value", async ({ page }) => {
    await note(page).fill("call the supplier");

    await link(page).click();

    await expect(question(page)).toBeVisible();
    await question(page).getByRole("button", { name: "Keep editing" }).click();
    await expect(question(page)).toBeHidden();
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
    await expect(note(page)).toHaveValue("call the supplier");
  });

  test("Discard continues to the link and leaves no duplicate entry behind", async ({ page }) => {
    await note(page).fill("call the supplier");
    await link(page).click();

    await question(page).getByRole("button", { name: "Discard" }).click();

    await expect(page).toHaveURL(new RegExp(`${away}$`));
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
    await expect(question(page)).toBeHidden();
  });

  test("a clean page navigates without asking", async ({ page }) => {
    await link(page).click();

    await expect(page).toHaveURL(new RegExp(`${away}$`));
  });

  test("a saved note is clean again", async ({ page }) => {
    await note(page).fill("call the supplier");
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByTestId("kit-note-saved")).toHaveText("Saved: call the supplier");

    await link(page).click();

    await expect(page).toHaveURL(new RegExp(`${away}$`));
  });

  test("Back asks, Keep editing stays and asks again on the next Back, Discard leaves", async ({ page }) => {
    await note(page).fill("call the supplier");

    await page.goBack();
    await expect(question(page)).toBeVisible();
    await question(page).getByRole("button", { name: "Keep editing" }).click();
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
    await expect(note(page)).toHaveValue("call the supplier");
    await expect(question(page)).toBeHidden();
    await expect.poll(() => historyIndex(page)).toBe(1);

    await page.goBack();
    await expect(question(page)).toBeVisible();
    await question(page).getByRole("button", { name: "Discard" }).click();

    await expect(page).toHaveURL("about:blank");
  });

  test("a reload or tab close raises the browser's own prompt", async ({ page }) => {
    await note(page).fill("call the supplier");
    const prompt = page.waitForEvent("dialog");

    await page.close({ runBeforeUnload: true });

    const dialog = await prompt;
    expect(dialog.type()).toBe("beforeunload");
    await dialog.dismiss();
  });

  test("a dirty form dialog asks on a route change and keeps its fields on Keep editing", async ({ page }) => {
    await page.getByRole("button", { name: "Add guest" }).click();
    const dialog = page.getByRole("dialog", { name: "Add guest" });
    await dialog.getByLabel("Name").fill("Ana Ruiz");

    await page.goBack();

    await expect(question(page)).toBeVisible();
    await question(page).getByRole("button", { name: "Keep editing" }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Name")).toHaveValue("Ana Ruiz");
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
  });
});

test.describe("guarded exit after the router rewrites the history state", () => {
  const note = (page: Page) => page.getByLabel("Note", { exact: true });
  const question = (page: Page) => page.getByRole("alertdialog", { name: "Discard changes?" });

  const refreshWhileDirty = async (page: Page) => {
    await note(page).fill("call the supplier");
    const refreshed = page.waitForResponse((response) => response.request().headers().rsc === "1");
    await page.getByRole("button", { name: "Refresh data" }).click();
    await refreshed;
  };

  test("Back after a refresh asks once, Keep editing stays, and the next Back asks once again", async ({ page }) => {
    await refreshWhileDirty(page);

    await page.goBack();
    await expect(question(page)).toHaveCount(1);
    await question(page).getByRole("button", { name: "Keep editing" }).click();
    await expect(question(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
    await expect.poll(() => historyIndex(page)).toBe(1);
    await page.goBack();

    await expect(question(page)).toHaveCount(1);
  });

  test("a link after a refresh leaves with no duplicate of the page behind the new one", async ({ page }) => {
    await refreshWhileDirty(page);
    await page.getByRole("link", { name: "Go to the dashboard" }).click();

    await question(page).getByRole("button", { name: "Discard" }).click();

    await expect(page).toHaveURL(/\/dashboard\/default$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
    await expect(question(page)).toHaveCount(0);
  });
});

test.describe("every way out of the page asks while it is dirty", () => {
  const question = (page: Page) => page.getByRole("alertdialog", { name: "Discard changes?" });

  test("the logo link asks", async ({ page }) => {
    await page.getByLabel("Note", { exact: true }).fill("call the supplier");

    await page.locator("header a").first().click();

    await expect(question(page)).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
  });

  test("the search dialog asks before it navigates", async ({ page }) => {
    await page.getByLabel("Note", { exact: true }).fill("call the supplier");
    await page.keyboard.press("Control+j");

    await page.getByRole("option").first().click();

    await expect(question(page)).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/kit$/);
  });
});

test.describe("popover focus", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "Below 768 px the panel is a modal sheet");

  test("clicking another field while it is open keeps focus there instead of jumping back to the trigger", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Filter reservations" }).click();
    await expect(page.getByRole("dialog", { name: "Filter reservations" })).toBeVisible();

    await page.getByLabel("Note", { exact: true }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByLabel("Note", { exact: true })).toBeFocused();
  });
});

import { expect, test } from "@playwright/test";

/** Bookings on a coarse pointer (spec 002, quality bar): its tags stay pills, one line high. Owned by bookings. */
test.describe("pills on a coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });

  test("booking tags stay on one line in the list", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    await page.goto("/dashboard/bookings");
    // The room loads lazily (a WebGL engine in its own chunk): a table plate on screen means the page is hydrated, so
    // the List radio answers. The wait is generous because a loaded CI machine renders the scene in software.
    await expect(page.getByRole("button", { name: /^S3, \d+ seats/ })).toBeVisible({ timeout: 30_000 });
    const list = page.getByRole("radiogroup", { name: "Reservations view" }).getByRole("radio", { name: "List" });
    await list.click();
    await expect(list).toBeChecked();
    const tags = page.getByRole("list", { name: "Notes" }).locator('[data-slot="badge"]');
    await expect(tags.first()).toBeVisible();
    const heights = await tags.evaluateAll((badges) => badges.map((badge) => badge.getBoundingClientRect().height));
    expect(Math.max(...heights)).toBeLessThanOrEqual(24);
  });
});

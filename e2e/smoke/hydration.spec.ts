import { expect, test } from "@playwright/test";

/**
 * Window rule: nothing modal before hydration. With JavaScript off the browser shows exactly the server HTML, which
 * must hold no open dialog, sheet or drawer.
 */

test.use({ javaScriptEnabled: false });

for (const route of ["/", "/dashboard/default", "/dashboard/bookings"]) {
  test(`the server HTML of ${route} holds no open overlay`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("[role=dialog], [role=alertdialog]")).toHaveCount(0);
  });
}

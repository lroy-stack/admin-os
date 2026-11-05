import { expect, test } from "@playwright/test";

import { PAGE_ROUTES } from "./routes";

/**
 * Window rule: nothing modal before hydration. With JavaScript off the browser shows exactly the server HTML, which
 * must hold no open dialog, sheet or drawer.
 */

test.use({ javaScriptEnabled: false });

const ROUTES = ["/", "/dashboard/default", "/dashboard/bookings", "/dashboard/kit"].filter((route) =>
  PAGE_ROUTES.includes(route),
);

for (const route of ROUTES) {
  test(`the server HTML of ${route} holds no open overlay`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("[role=dialog], [role=alertdialog]")).toHaveCount(0);
  });
}

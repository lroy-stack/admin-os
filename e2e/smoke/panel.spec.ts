import { expect, test } from "@playwright/test";

/**
 * ResponsivePanel (spec 003, K1): a reservation opens as a right side sheet from 768 px and as a bottom drawer
 * below. Focus moves into the panel, Escape closes it and focus returns to the trigger.
 */

const VIEWPORTS = [
  { name: "side sheet at 1440 px", width: 1440, height: 900, direction: "right" },
  { name: "bottom drawer at 375 px", width: 375, height: 812, direction: "bottom" },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("opens a reservation, keeps focus inside and returns it on Escape", async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
      await page.goto("/dashboard/bookings");
      await page.getByRole("radio", { name: "List" }).click();
      const trigger = page.locator("td button").first();
      const guest = (await trigger.textContent()) ?? "";

      await trigger.click();

      const panel = page.getByRole("dialog", { name: guest });
      const focusIsInside = () => panel.evaluate((element) => element.contains(document.activeElement));
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("data-vaul-drawer-direction", viewport.direction);
      await expect.poll(focusIsInside).toBe(true);

      await page.keyboard.press("Tab");
      await expect.poll(focusIsInside).toBe(true);

      await page.keyboard.press("Escape");

      await expect(panel).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  });
}

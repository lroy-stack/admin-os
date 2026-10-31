import { expect, type Page, test } from "@playwright/test";

/**
 * Touch-target bar (spec 002, quality bar): on a coarse pointer every visible interactive primitive offers at least
 * 44 × 44 px, either by its own box or, for glyph controls, by its invisible ::after hit area. A fine pointer keeps
 * the compact desktop sizes.
 */

const ROWS = [
  "button",
  "toggle",
  "toggle-group-item",
  "tabs-trigger",
  "select-trigger",
  "input",
  "textarea",
  "input-group-button",
  "pagination-link",
  "accordion-trigger",
];
const GLYPHS = ["checkbox", "radio-group-item", "switch", "slider-thumb"];
const ROUTES = ["/dashboard/default", "/dashboard/invoice", "/dashboard/bookings"];

/** Smallest target among visible elements of the given slots: own box for rows, ::after box for glyphs. */
const smallestTarget = (page: Page, rows: string[], glyphs: string[]) =>
  page.evaluate(
    ({ rows, glyphs }) => {
      const visible = (element: Element) => (element as HTMLElement).checkVisibility?.() ?? true;
      const measure = (slots: string[], pseudo: boolean) =>
        slots.flatMap((slot) =>
          [...document.querySelectorAll(`[data-slot="${slot}"]`)].filter(visible).map((element) => {
            const box = element.getBoundingClientRect();
            const after = getComputedStyle(element, "::after");
            const height = pseudo ? Math.max(box.height, Number.parseFloat(after.height) || 0) : box.height;
            return { slot, height: Math.round(height) };
          }),
        );
      const all = [...measure(rows, false), ...measure(glyphs, true)];
      return {
        count: all.length,
        smallest: all.reduce((min, item) => (item.height < min.height ? item : min), all[0]),
      };
    },
    { rows, glyphs },
  );

test.describe("touch targets on a coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const route of ROUTES) {
    test(`every control on ${route} is at least 44 px`, async ({ page }) => {
      await page.goto(route);
      expect(await page.evaluate(() => matchMedia("(any-pointer: coarse)").matches)).toBe(true);
      const { count, smallest } = await smallestTarget(page, ROWS, GLYPHS);
      expect(count).toBeGreaterThan(0);
      expect(smallest.height, `smallest: ${smallest.slot}`).toBeGreaterThanOrEqual(44);
    });
  }
});

test.describe("compact controls on a fine pointer", () => {
  test("keeps the desktop icon buttons at their drawn size", async ({ page }) => {
    await page.goto("/dashboard/default");
    expect(await page.evaluate(() => matchMedia("(any-pointer: coarse)").matches)).toBe(false);
    const { smallest } = await smallestTarget(page, ["button"], []);
    expect(smallest.height).toBeLessThan(44);
  });
});

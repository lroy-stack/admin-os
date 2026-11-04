import { expect, type Page, test } from "@playwright/test";

/**
 * Touch-target bar (spec 002, quality bar): on a coarse pointer every visible interactive primitive offers at least
 * 44 × 44 px, either by its own box or, for glyph controls and the segments of a glass capsule, by its invisible
 * ::after hit area. A fine pointer keeps the compact desktop sizes. A glass capsule keeps its drawn height on touch, so
 * its sliding thumb never leaves it.
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
/** The segments of a glass capsule (`SegmentedControl`): a hit area, like the glyphs, not a row. */
const GLASS_SEGMENT = '.liquid-glass[data-slot="toggle-group"] > [data-slot="toggle-group-item"]';
const ROUTES = ["/", "/dashboard/default", "/dashboard/invoice", "/dashboard/bookings", "/dashboard/customers"];
const CAPSULE_ROUTES = [
  "/dashboard/default",
  "/dashboard/bookings",
  "/dashboard/customers",
  "/dashboard/crm",
  "/dashboard/analytics",
  "/dashboard/calendar",
];

/** Smallest target among visible elements: own box for rows, ::after box for glyphs and glass segments. */
const smallestTarget = (page: Page, rows: string[], glyphs: string[]) =>
  page.evaluate(
    ({ rows, glyphs, glassSegment }) => {
      const visible = (element: Element) => (element as HTMLElement).checkVisibility?.() ?? true;
      const measure = (selectors: string[], pseudo: boolean) =>
        selectors.flatMap((selector) =>
          [...document.querySelectorAll(selector)]
            .filter(visible)
            .filter((element) => pseudo || !element.matches(glassSegment))
            .map((element) => {
              const box = element.getBoundingClientRect();
              const after = getComputedStyle(element, "::after");
              const height = pseudo ? Math.max(box.height, Number.parseFloat(after.height) || 0) : box.height;
              return { slot: selector, height: Math.round(height) };
            }),
        );
      const slots = (names: string[]) => names.map((name) => `[data-slot="${name}"]`);
      const all = [
        ...measure(slots(rows), false),
        ...measure([...slots(glyphs), ...(glyphs.length > 0 ? [glassSegment] : [])], true),
      ];
      return {
        count: all.length,
        smallest: all.reduce((min, item) => (item.height < min.height ? item : min), all[0]),
      };
    },
    { rows, glyphs, glassSegment: GLASS_SEGMENT },
  );

/** Every sliding thumb whose box leaves its capsule, with both boxes, and how many thumbs were checked. */
const thumbsOutsideCapsules = (page: Page) =>
  page.evaluate(() => {
    const thumbs = [...document.querySelectorAll(".liquid-thumb")].filter(
      (thumb) => thumb.parentElement?.matches('.liquid-glass[data-slot="toggle-group"]') ?? false,
    );
    const outside = thumbs.flatMap((thumb) => {
      const t = thumb.getBoundingClientRect();
      const c = (thumb.parentElement as HTMLElement).getBoundingClientRect();
      const inside =
        t.top >= c.top - 0.5 && t.bottom <= c.bottom + 0.5 && t.left >= c.left - 0.5 && t.right <= c.right + 0.5;
      return inside ? [] : [{ thumb: [t.width, t.height], capsule: [c.width, c.height] }];
    });
    return { checked: thumbs.length, outside };
  });

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

test.describe("glass capsules on a coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const route of CAPSULE_ROUTES) {
    test(`every sliding thumb on ${route} stays inside its capsule`, async ({ page }) => {
      await page.goto(route);
      // Wait for a capsule's own thumb: the nav thumb appears first, and a slow machine measures before the rest.
      await expect(page.locator('.liquid-glass[data-slot="toggle-group"] > .liquid-thumb').first()).toBeVisible();
      const { checked, outside } = await thumbsOutsideCapsules(page);
      expect(checked).toBeGreaterThan(0);
      expect(outside).toEqual([]);
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

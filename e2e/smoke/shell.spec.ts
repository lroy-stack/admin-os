import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * Shell smoke (ADR 0008): every locale and role loads the dashboard shell in its own language, with no console
 * error, page error or failed request. The preset axis (`demo_preset`) and the account-menu demo switches (role,
 * preset, reset) are covered below.
 */

const LOCALES = ["en", "es", "de", "fr"] as const;
const ROLES = ["owner", "manager", "staff"] as const;

/**
 * Pinned shell wording per locale (the "Home" pill and the Preferences trigger). The smoke pins behaviour, so a
 * wording change updates these in the same change (ADR 0008, "Timing").
 */
const ANCHORS = {
  en: { home: "Home", preferences: "Preferences" },
  es: { home: "Inicio", preferences: "Preferencias" },
  de: { home: "Start", preferences: "Einstellungen" },
  fr: { home: "Accueil", preferences: "Préférences" },
} as const satisfies Record<(typeof LOCALES)[number], { home: string; preferences: string }>;

/** Per locale, a pattern that matches the Preferences trigger of every other locale, which must be absent. */
const OTHER_LOCALES_PREFERENCES = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    new RegExp(
      `^(${LOCALES.filter((other) => other !== locale)
        .map((other) => ANCHORS[other].preferences)
        .join("|")})$`,
    ),
  ]),
) as Record<(typeof LOCALES)[number], RegExp>;

// Parametrised tests: the loops generate one test per combination; no test body branches.
for (const locale of LOCALES) {
  for (const role of ROLES) {
    test(`shell in ${locale} as ${role}`, async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "locale", value: locale, url: baseURL },
        { name: "demo_role", value: role, url: baseURL },
      ]);
      const problems = watch(page);

      await page.goto("/dashboard/default");

      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator(`[lang="${locale}"]`).first()).toBeAttached();
      await expect(page.getByRole("link", { name: ANCHORS[locale].home, exact: true }).first()).toBeAttached();
      await expect(page.getByRole("button", { name: ANCHORS[locale].preferences }).first()).toBeAttached();
      await expect(page.getByRole("button", { name: OTHER_LOCALES_PREFERENCES[locale] })).toHaveCount(0);
      expect(problems).toEqual([]);
    });
  }
}

/**
 * Preset axis: each preset words its own areas (hospitality "Reservations", salon "Appointments"). The nav is
 * filtered by permission, but today owner, manager and staff all hold `read:bookings`, so the three roles see the
 * same entries; the test pins that, and that no entry of another module (Team, Menu...) is in the DOM.
 * The permission-gated hiding itself is unit-tested (`visibleNavIds`); a real difference joins with the next gated area.
 */
const PRESETS = [
  {
    preset: "hospitality",
    bookings: "Reservations",
    customers: "Guests",
    absent: ["Appointments", "Team", "Menu", "Clients", "Tables"],
  },
  {
    preset: "salon",
    bookings: "Appointments",
    customers: "Clients",
    absent: ["Reservations", "Team", "Menu", "Guests", "Tables"],
  },
] as const;

/** Words of the hospitality preset that must not show up in a salon shell (its `leakTerms`, plus its area names). */
const HOSPITALITY_WORDS =
  /\b(reservations?|diner|dining|covers|waiter|allergen|dish(es)?|restaurant|mesa|comensal|carta|guests?|tables?)\b/i;

for (const { preset, bookings, customers, absent } of PRESETS) {
  for (const role of ROLES) {
    test(`${preset} nav as ${role}: same entries, none hidden left in the DOM`, async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "locale", value: "en", url: baseURL },
        { name: "demo_role", value: role, url: baseURL },
        { name: "demo_preset", value: preset, url: baseURL },
      ]);
      await page.goto("/dashboard/default");

      const sections = page.getByRole("navigation", { name: "Sections" });
      await expect(sections.getByRole("link", { name: "Home", exact: true })).toBeVisible();
      await expect(sections.getByRole("link", { name: bookings, exact: true })).toBeVisible();
      await expect(sections.getByRole("link", { name: customers, exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(`^(${absent.join("|")})$`) })).toHaveCount(0);
    });
  }
}

test("a salon shell uses no hospitality vocabulary", async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: "locale", value: "en", url: baseURL },
    { name: "demo_preset", value: "salon", url: baseURL },
  ]);
  await page.goto("/dashboard/default");
  await expect(
    page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Appointments" }),
  ).toBeVisible();

  const shellText = [
    await page.locator("header").first().innerText(),
    await page.locator("aside").first().innerText(),
    ...(await page
      .locator("header a, aside a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("aria-label") ?? ""))),
  ].join(" ");
  expect(shellText).not.toMatch(HOSPITALITY_WORDS);
});

const openAccountMenu = (page: Page) => page.getByRole("button", { name: /Account: / }).click();

test("the account menu switches the role", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
  await page.goto("/dashboard/default");

  await openAccountMenu(page);
  await page.getByRole("menuitemradio", { name: "Manager" }).click();

  await expect.poll(async () => (await context.cookies()).find((c) => c.name === "demo_role")?.value).toBe("manager");
  await openAccountMenu(page);
  await expect(page.getByRole("menuitemradio", { name: "Manager" })).toBeChecked();
});

test("the account menu switches the preset and the shell follows", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
  await page.goto("/dashboard/default");
  await expect(
    page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Reservations" }),
  ).toBeVisible();

  await openAccountMenu(page);
  await page.getByRole("menuitemradio", { name: "Salon" }).click();

  await expect(
    page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Appointments" }),
  ).toBeVisible();
  await openAccountMenu(page);
  await expect(page.getByRole("menuitemradio", { name: "Stylist" })).toBeVisible();
});

test("the account menu resets the demo data", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
  await page.goto("/dashboard/default");

  await openAccountMenu(page);
  await page.getByRole("menuitem", { name: "Reset demo data" }).click();

  await expect(page.getByText("Demo data reset.")).toBeVisible();
});

/**
 * Every account menu item has a destination (plan 009 D1, ADR 0015: a control with no destination is removed):
 * Account opens the signed-in person's profile, Notifications opens the bell's inbox, Log out the sign-in page.
 */
test("the account menu's items each lead somewhere", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
  await page.goto("/dashboard/default", { waitUntil: "networkidle" });

  await openAccountMenu(page);
  await expect(page.getByRole("menuitem", { name: "Account" })).toHaveAttribute("href", "/dashboard/profile");
  await expect(page.getByRole("menuitem", { name: "Business settings" })).toHaveAttribute(
    "href",
    "/dashboard/settings",
  );
  await expect(page.getByRole("menuitem", { name: "Log out" })).toHaveAttribute("href", "/auth/v1/login");

  await page.getByRole("menuitem", { name: "Notifications" }).click();
  await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
});

test("a section far to the right scrolls the nav row, never the page", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
  await page.goto("/dashboard/kanban");
  await expect(page.getByRole("navigation", { name: "Sections" }).first()).toBeVisible();

  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

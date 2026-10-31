import { expect, type Page, test } from "@playwright/test";

/**
 * Shell smoke (ADR 0008): every locale and role loads the dashboard shell in its own language, with no console
 * error, page error or failed request. Role-specific visibility joins when the shell filters by permission (T6b);
 * the preset axis joins with the preset demo switch.
 */

const LOCALES = ["en", "es", "de", "fr"] as const;
const ROLES = ["owner", "manager", "staff"] as const;

/**
 * Pinned shell wording per locale (the "Overview" pill and the Preferences trigger). The smoke pins behaviour, so a
 * wording change updates these in the same change (ADR 0008, "Timing").
 */
const ANCHORS = {
  en: { overview: "Overview", preferences: "Preferences" },
  es: { overview: "Resumen", preferences: "Preferencias" },
  de: { overview: "Übersicht", preferences: "Einstellungen" },
  fr: { overview: "Aperçu", preferences: "Préférences" },
} as const satisfies Record<(typeof LOCALES)[number], { overview: string; preferences: string }>;

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

/** Collects what must stay empty: console errors, uncaught page errors and failed requests (aborted prefetches aside). */
const watch = (page: Page) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`);
    }
  });
  return problems;
};

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
      await expect(page.getByRole("link", { name: ANCHORS[locale].overview, exact: true }).first()).toBeAttached();
      await expect(page.getByRole("button", { name: ANCHORS[locale].preferences }).first()).toBeAttached();
      await expect(page.getByRole("button", { name: OTHER_LOCALES_PREFERENCES[locale] })).toHaveCount(0);
      expect(problems).toEqual([]);
    });
  }
}

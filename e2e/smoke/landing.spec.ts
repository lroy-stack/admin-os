import { expect, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * Landing smoke (ADR 0008): the language picker in the header switches the page and `<html lang>`, and the demo opened
 * from the hero keeps the language, because both read the same locale cookie (ADR 0007).
 */

test("the landing switches the language and the demo keeps it", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
  const problems = watch(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByRole("combobox", { name: "Language" }).click();
  await expect(page.getByRole("option", { name: "Deutsch" })).toHaveAttribute("lang", "de");
  await page.getByRole("option", { name: "Deutsch" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Das Open-Source-Verwaltungsdashboard für kleine Unternehmen.",
  );
  await expect(page.getByRole("combobox", { name: "Sprache" })).toHaveText("Deutsch");
  await expect.poll(async () => (await context.cookies()).find((c) => c.name === "locale")?.value).toBe("de");

  await page.getByRole("link", { name: "Demo öffnen" }).click();
  await page.waitForURL("**/dashboard/default");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("link", { name: "Start", exact: true }).first()).toBeAttached();
  expect(problems).toEqual([]);
});

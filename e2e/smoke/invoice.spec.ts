import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The invoice starts from the business settings, the session's client parties and its catalog (specs 008, 011): the
 * hospitality preset's company issues it, each preset's first client party is billed, its first catalog items are the
 * lines, and a change the owner saves in Settings is on the next invoice. The wording is the `en` dictionary and the data the seeded preset.
 */

// The preview and the copy kept for printing are the same paper; the first is the one on screen.
const paperOf = (page: Page) => page.locator("[data-print-paper]").first();

/** Each preset's first client party and first agenda customer (ADR 0019 §5); only the party is billed. */
const BILLED = [
  {
    preset: "hospitality",
    party: "Servicios Corporativos Levante S.L.",
    taxId: "B00000201",
    street: "Calle del Comercio 12",
    customer: "Iglesias",
  },
  {
    preset: "salon",
    party: "Hotel Balneario Costa Azul S.L.",
    taxId: "B00000206",
    street: "Paseo Marítimo 20",
    customer: "Nora",
  },
  {
    preset: "workshop",
    party: "Transportes Rápidos del Sur S.L.",
    taxId: "B00000209",
    street: "Polígono Las Salinas 4",
    customer: "Carmen",
  },
] as const;

test.describe("invoice from the business settings", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ context, baseURL, page }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "currency", value: "EUR", url: baseURL },
    ]);
    problems = watch(page);
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("is issued by the preset's company, with its tax and terms (AC7)", async ({ page }) => {
    await page.goto("/dashboard/invoice");

    await expect(paperOf(page)).toContainText("Lumbre Hostelería S.L.");
    await expect(paperOf(page)).toContainText("Tax ID: B00000017");
    await expect(paperOf(page)).toContainText("Account no.: ES00 0000 0000 0000 0000 0101");
    await expect(paperOf(page)).toContainText("VAT 10%");
    await expect(paperOf(page)).toContainText("Payment due: Nov 15, 2026");
  });

  for (const billed of BILLED) {
    test(`${billed.preset} bills its first client party, never an agenda customer (spec 011)`, async ({
      page,
      context,
      baseURL,
    }) => {
      await context.addCookies([{ name: "demo_preset", value: billed.preset, url: baseURL }]);
      await page.goto("/dashboard/invoice");

      await expect(paperOf(page)).toContainText(billed.party);
      await expect(paperOf(page)).toContainText(`Tax ID: ${billed.taxId}`);
      await expect(paperOf(page)).toContainText(billed.street);
      await expect(paperOf(page)).not.toContainText(billed.customer);
    });
  }

  test("starts with the session's catalog items (AC8)", async ({ page }) => {
    await page.goto("/dashboard/invoice");

    await expect(paperOf(page)).toContainText("Ham croquettes");
  });

  test("links to the business details it prints", async ({ page }) => {
    await page.goto("/dashboard/invoice");
    await page.getByRole("link", { name: "Business details" }).click();

    await expect(page).toHaveURL(/\/dashboard\/settings$/);
  });

  test("follows what the owner saves in Settings, without a deploy (AC7)", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.getByRole("button", { name: "Edit" }).click();
    const window = page.getByRole("dialog", { name: "Edit business details" });
    await window.getByRole("textbox", { name: "Legal name" }).fill("Lumbre Grupo S.L.");
    await window.getByRole("textbox", { name: "VAT rate (%)" }).fill("21");
    await window.getByRole("textbox", { name: "Payment terms (days)" }).fill("30");
    await window.getByRole("button", { name: "Save" }).click();
    await expect(window).toBeHidden();

    await page.goto("/dashboard/invoice");

    await expect(paperOf(page)).toContainText("Lumbre Grupo S.L.");
    await expect(paperOf(page)).toContainText("VAT 21%");
    await expect(paperOf(page)).toContainText("Payment due: Nov 30, 2026");
  });
});

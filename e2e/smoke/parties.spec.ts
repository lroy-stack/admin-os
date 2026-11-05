import { expect, type Page, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The parties directory (ADR 0019 §4): the seeded clients and suppliers of the hospitality preset, the role filter and
 * the search (both narrow the loaded page), the record panel, Add and Edit in a form dialog for who
 * manages parties, and no such control for staff. The wording is the `en` dictionary and the data the seeded preset.
 */

const LEVANTE = "Servicios Corporativos Levante S.L.";
const MEDITERRANEA = "Mediterránea de Eventos S.A.";
const LAURA = "Laura Gómez Ruiz";
const DISTRIBUTOR = "Distribuciones Alimentarias del Mediterráneo S.L.";
const WINERY = "Bodegas Sierra Alta S.L.";

const names = (page: Page) => page.getByRole("heading", { level: 3 });
const panelOf = (page: Page, name: string) => page.getByRole("dialog", { name });
const toastOf = (page: Page) => page.locator("[data-sonner-toast]").first();

test.describe("parties directory", () => {
  let problems: string[] = [];

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/parties");
    await expect(page.getByRole("heading", { level: 1, name: "Parties" })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("lists the seeded clients and suppliers with their roles", async ({ page }) => {
    await expect(names(page)).toHaveText([LEVANTE, MEDITERRANEA, LAURA, DISTRIBUTOR, WINERY]);
    await expect(page.getByText("Tax ID B00000205")).toBeVisible();
  });

  test("the role filter keeps only suppliers, and Clients brings the clients back", async ({ page }) => {
    const filter = page.getByRole("radiogroup", { name: "Show" });

    await filter.getByRole("radio", { name: "Suppliers" }).click();
    await expect(names(page)).toHaveText([DISTRIBUTOR, WINERY]);

    await filter.getByRole("radio", { name: "Clients" }).click();
    await expect(names(page)).toHaveText([LEVANTE, MEDITERRANEA, LAURA]);
  });

  test("search narrows the list by name or tax ID", async ({ page }) => {
    const search = page.getByRole("textbox", { name: "Search parties" });

    await search.fill("bodegas");
    await expect(names(page)).toHaveText([WINERY]);

    await search.fill("B00000204");
    await expect(names(page)).toHaveText([DISTRIBUTOR]);
  });

  test("a search with no match says so", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search parties" }).fill("zzzz");

    await expect(page.getByText("No parties found")).toBeVisible();
    await expect(page.getByText("Nothing matches “zzzz”.")).toBeVisible();
  });

  test("a role and a search that exclude each other say nothing matches", async ({ page }) => {
    await page.getByRole("radiogroup", { name: "Show" }).getByRole("radio", { name: "Suppliers" }).click();
    await page.getByRole("textbox", { name: "Search parties" }).fill("levante");

    await expect(page.getByText("Nothing matches “levante”.")).toBeVisible();
  });

  test("a party opens in the record panel with its fiscal data and contact links", async ({ page }) => {
    await page.getByRole("button", { name: WINERY }).click();

    const panel = panelOf(page, WINERY);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("B00000205");
    await expect(panel).toContainText("Camino de la Viña 2");
    await expect(panel).toContainText("Spain");
    await expect(panel.getByRole("link", { name: "ventas@bodegas-sierra-alta.example" })).toHaveAttribute(
      "href",
      "mailto:ventas@bodegas-sierra-alta.example",
    );
    await expect(panel.getByRole("button", { name: "Edit party" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.getByRole("button", { name: WINERY })).toBeFocused();
  });

  test("a later page starts where its cursor says and links back to the first", async ({ page }) => {
    // The opaque cursor of the mock is base64url of {"o": offset}; the seed lists five parties.
    await page.goto(`/dashboard/parties?cursor=${Buffer.from('{"o":4}').toString("base64url")}`);

    await expect(names(page)).toHaveText([WINERY]);
    await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "First page" }).click();
    await expect(names(page)).toHaveCount(5);
  });

  test("an invalid cursor shows the error state, not an empty list", async ({ page }) => {
    await page.goto("/dashboard/parties?cursor=nope");

    await expect(page.locator('[data-state="error"]')).toContainText("Could not load this");
  });
});

test.describe("add and edit a party", () => {
  let problems: string[] = [];
  const dialogOf = (page: Page, name: string) => page.getByRole("dialog", { name });

  test.beforeEach(async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    problems = watch(page);
    await page.goto("/dashboard/parties");
    await expect(page.getByRole("heading", { level: 1, name: "Parties" })).toBeVisible();
  });

  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("Enter on an empty form puts focus on the first invalid field", async ({ page }) => {
    await page.getByRole("main").getByRole("button", { name: "Add party" }).click();
    await page.keyboard.press("Enter");

    const dialog = dialogOf(page, "Add party");
    await expect(dialog.getByRole("textbox", { name: "Legal name" })).toBeFocused();
    await expect(dialog.getByText("Enter a legal name.")).toBeVisible();
    await expect(dialog.getByText("Enter at least one address line.")).toBeVisible();
  });

  test("the owner adds a party, it is announced and listed", async ({ page }) => {
    await page.getByRole("main").getByRole("button", { name: "Add party" }).click();

    const dialog = dialogOf(page, "Add party");
    await dialog.getByRole("textbox", { name: "Legal name" }).fill("Zoe Quintana");
    await dialog.getByRole("combobox", { name: "Type" }).selectOption("person");
    await dialog.getByRole("textbox", { name: "Tax ID" }).fill("00000999Z");
    await dialog.getByRole("textbox", { name: "Address" }).fill("Calle Luna 4\n03001 Alicante");
    await dialog.getByRole("textbox", { name: "Email" }).fill("zoe@example.com");
    await dialog.getByRole("textbox", { name: "Phone" }).fill("+34 611 222 333");
    await dialog.getByRole("button", { name: "Add party" }).click();

    await expect(dialog).toBeHidden();
    await expect(toastOf(page)).toContainText("Party added: Zoe Quintana");
    await expect(names(page)).toHaveText([LEVANTE, MEDITERRANEA, LAURA, DISTRIBUTOR, WINERY, "Zoe Quintana"]);
    await expect(page.getByRole("main").getByRole("button", { name: "Add party" })).toBeFocused();
  });

  test("the owner edits a party from its panel and the change is listed", async ({ page }) => {
    await page.getByRole("button", { name: WINERY }).click();
    await panelOf(page, WINERY).getByRole("button", { name: "Edit party" }).click();

    const dialog = dialogOf(page, "Edit party");
    await expect(dialog.getByRole("textbox", { name: "Legal name" })).toHaveValue(WINERY);
    await dialog.getByRole("textbox", { name: "Trade name" }).fill("Sierra Alta");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeHidden();
    await expect(toastOf(page)).toContainText(`Party saved: ${WINERY}`);
    await expect(page.getByText("Sierra Alta", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: WINERY })).toBeFocused();
  });

  test("a dirty window asks before it closes", async ({ page }) => {
    await page.getByRole("main").getByRole("button", { name: "Add party" }).click();
    await dialogOf(page, "Add party").getByRole("textbox", { name: "Legal name" }).fill("Half typed");
    await page.keyboard.press("Escape");

    await expect(page.getByRole("alertdialog", { name: "Discard changes?" })).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();

    await expect(dialogOf(page, "Add party")).toBeHidden();
    await expect(names(page)).toHaveCount(5);
  });

  test("the windows open above the page without moving it (ADR 0015)", async ({ page }) => {
    // By CSS, not by role: an open modal hides the page from the accessibility tree.
    const list = page.locator("main ul").first();
    const before = await list.boundingBox();

    await page.getByRole("main").getByRole("button", { name: "Add party" }).click();
    await expect(dialogOf(page, "Add party")).toBeVisible();
    expect(await list.boundingBox()).toEqual(before);

    await page.keyboard.press("Escape");
    await expect(dialogOf(page, "Add party")).toBeHidden();
    // The first card, already in view at 375 px: opening a card further down would scroll the page to reach it.
    await page.getByRole("button", { name: LEVANTE }).click();
    await expect(panelOf(page, LEVANTE)).toBeVisible();
    expect(await list.boundingBox()).toEqual(before);
  });
});

test.describe("staff", () => {
  test("read the directory and its panel, with no Add and no Edit", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_role", value: "staff", url: baseURL },
    ]);
    await page.goto("/dashboard/parties");

    await expect(names(page)).toHaveCount(5);
    await expect(page.getByRole("button", { name: "Add party" })).toHaveCount(0);

    await page.getByRole("button", { name: WINERY }).click();
    await expect(panelOf(page, WINERY)).toContainText("B00000205");
    await expect(page.getByRole("button", { name: "Edit party" })).toHaveCount(0);
  });
});

test.describe("parties in other presets", () => {
  test("a salon lists its own parties and offers the screen in its nav", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "salon", url: baseURL },
    ]);
    await page.goto("/dashboard/parties");

    await expect(page.getByRole("heading", { level: 1, name: "Parties" })).toBeVisible();
    await expect(names(page)).toHaveCount(3);
    await expect(
      page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Parties" }),
    ).toBeVisible();
  });

  test("a workshop lists its own parties", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "locale", value: "en", url: baseURL },
      { name: "demo_preset", value: "workshop", url: baseURL },
    ]);
    await page.goto("/dashboard/parties");

    await expect(names(page)).toHaveCount(4);
  });

  test("the Spanish page is in Spanish", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "es", url: baseURL }]);
    await page.goto("/dashboard/parties");

    await expect(page.getByRole("heading", { level: 1, name: "Terceros" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Buscar terceros" })).toBeVisible();
  });
});

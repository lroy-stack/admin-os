import { expect, test } from "@playwright/test";

import { watch } from "./watch";

/**
 * The team directory on the data seam (spec 012, R5): the preset's word for its staff in the nav and as the heading,
 * the seeded members as cards with their role names, and client-side search. The wording is the `en` dictionary and
 * the vocabulary of each preset; the data is the seeded mock.
 */

/**
 * `skill` is a seeded skill with words in the preset's terms and `rawSkill` the id the data holds. `leaks` are fields
 * of that preset's seed (contract terms and extensions) that no byte of the page may carry; each occurs in the seed.
 * `contract` is matched as a JSON key (`"contract":`, escaped or not in the RSC payload), since the actor's permission
 * list legitimately names `read:staff.contracts`.
 */
/** The `contract` key of a serialised record, plain or escaped inside the RSC payload. */
const CONTRACT_KEY = /\\?"contract\\?":/;
/** A seed value or field name that must not appear anywhere in the page. */
const field = (name: string) => new RegExp(name);

const PRESETS = [
  {
    preset: "hospitality",
    word: "Team",
    members: ["Marta", "Iker", "Lucía"],
    one: "Marta",
    role: "Manager",
    skill: "Sommelier",
    rawSkill: "sommelier",
    leaks: [field("full_time"), field("startDate"), field("hoursPerWeek"), CONTRACT_KEY, field("crew")],
  },
  {
    preset: "salon",
    word: "Stylists",
    members: ["Inés", "Pau"],
    one: "Pau",
    role: "Stylist",
    skill: "Colour",
    rawSkill: "colour",
    leaks: [field("commissionBp"), field("startDate"), CONTRACT_KEY],
  },
  {
    preset: "workshop",
    word: "Mechanics",
    members: ["Rafa"],
    one: "Rafa",
    role: "Mechanic",
    skill: "Brakes",
    rawSkill: "brakes",
    leaks: [field("certifications"), field("startDate"), field("hoursPerWeek"), CONTRACT_KEY],
  },
] as const;

for (const { preset, word, members, one, role, skill, rawSkill, leaks } of PRESETS) {
  test.describe(`team directory, ${preset} preset`, () => {
    let problems: string[] = [];

    test.beforeEach(async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "locale", value: "en", url: baseURL },
        { name: "demo_preset", value: preset, url: baseURL },
      ]);
      problems = watch(page);
    });

    test.afterEach(() => {
      expect(problems).toEqual([]);
    });

    test(`the "${word}" entry of the nav opens the directory under that word`, async ({ page }) => {
      // The nav row is client code: let it load before the click, as the cross-door spec does.
      await page.goto("/dashboard/default", { waitUntil: "networkidle" });
      await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: word, exact: true }).click();

      await expect(page).toHaveURL(/\/dashboard\/staff$/);
      await expect(page.getByRole("heading", { level: 1, name: word })).toBeVisible();
    });

    test("lists the seeded members in the order the list gives them, with a role name", async ({ page }) => {
      await page.goto("/dashboard/staff");

      await expect(page.getByRole("heading", { level: 3 })).toHaveText([...members]);
      await expect(page.getByRole("main").getByText(role, { exact: true }).first()).toBeVisible();
    });

    test("a seeded skill shows in the preset's words, not as the id the data holds", async ({ page }) => {
      await page.goto("/dashboard/staff");

      await expect(page.getByRole("main").getByText(skill, { exact: true })).toBeVisible();
      await expect(page.getByRole("main").getByText(rawSkill, { exact: true })).toHaveCount(0);
    });

    test("search narrows the list, and a search with no match says so", async ({ page }) => {
      await page.goto("/dashboard/staff");
      const search = page.getByRole("textbox", { name: "Search team members" });

      await search.fill(one.toLowerCase());
      await expect(page.getByRole("heading", { level: 3 })).toHaveText([one]);

      await search.fill("zzzz");
      await expect(page.getByText("No team members found")).toBeVisible();
      await expect(page.getByText("Nothing matches “zzzz”.")).toBeVisible();
    });

    test("shows neither contract terms nor extension fields, and no control that does nothing", async ({ page }) => {
      await page.goto("/dashboard/staff");
      await expect(page.getByRole("heading", { level: 3 })).toHaveText([...members]);

      await expect(page.getByRole("main")).not.toContainText(/full_time|employee|crew|commission/i);
      await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
      await expect(page.getByRole("main").getByRole("link")).toHaveCount(0);
    });

    test("the page the server sends carries no contract terms or extension fields", async ({ page }) => {
      const response = await page.request.get("/dashboard/staff");
      const html = await response.text();

      // A control: the same payload does carry the members, so a missing field is not a missing page.
      expect(members.every((name) => html.includes(name))).toBe(true);
      expect(leaks.filter((leak) => leak.test(html)).map(String)).toEqual([]);
    });
  });
}

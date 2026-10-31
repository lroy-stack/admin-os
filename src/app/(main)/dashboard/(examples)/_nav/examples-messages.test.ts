import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { examplesMessages } from "./examples-messages.server";
import { examplesNav } from "./examples-nav";

// The same word in every language of the kit.
const SAME_EVERYWHERE = ["chat", "legacy-crm"];

const items = examplesNav.flatMap((group) => group.items);
const ids = [...examplesNav.map((group) => group.id), ...items.map((item) => item.id)];

describe("examples dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(examplesMessages, SAME_EVERYWHERE)).not.toThrow();
  });

  it.each(LOCALES)("%s translates every group and item of examplesNav", (locale) => {
    expect(ids.filter((id) => !(id in examplesMessages[locale]))).toEqual([]);
  });

  it("has no translation for an id examplesNav does not list", () => {
    expect(Object.keys(examplesMessages.en).filter((id) => !ids.includes(id as never))).toEqual([]);
  });

  it.each(items.map((item) => [item.id, item.title] as const))(
    "pins the English label of %s to its source title",
    (id, title) => {
      expect(examplesMessages.en[id]).toBe(title);
    },
  );

  it("has unique ids and urls", () => {
    expect([new Set(ids).size, new Set(items.map((item) => item.url)).size]).toEqual([ids.length, items.length]);
  });
});

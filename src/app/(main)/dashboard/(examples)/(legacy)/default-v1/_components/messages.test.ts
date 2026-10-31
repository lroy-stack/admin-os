import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { defaultV1Messages } from "./messages.server";
import { localizeSections } from "./proposal-sections-table/sections.server";
import { sectionHeaders } from "./section-headers.server";

describe("Default V1 dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(defaultV1Messages)).not.toThrow();
  });
});

describe("Proposal section headers", () => {
  it("are complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(sectionHeaders)).not.toThrow();
  });

  it.each(LOCALES)("gives every section a header in %s", (locale) => {
    const sections = localizeSections(locale);

    expect(sections).toHaveLength(Object.keys(sectionHeaders[locale]).length);
    expect(sections.filter((section) => section.header.trim() === "")).toEqual([]);
  });
});

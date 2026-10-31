import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";
import { customers } from "@/data/crm";

import { customerDirectoryMessages } from "./messages.server";

describe("customer directory dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(customerDirectoryMessages)).not.toThrow();
  });

  it.each(LOCALES)("translates the job title of every customer in %s", (locale) => {
    const missing = customers.filter((customer) => !(customer.title in customerDirectoryMessages[locale].jobTitles));
    expect(missing.map((customer) => customer.id)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import { LOCALES } from "@/core/i18n";

import { productsMessages } from "./messages.server";
import { createProductSchema } from "./product-schema";

const valid = {
  name: "Tee",
  description: "A tee",
  images: [],
  sku: "CL-TEE-105",
  category: "clothing",
  status: "draft",
  price: "29.00",
  stock: "4",
};

function problems(locale: (typeof LOCALES)[number], patch: Partial<typeof valid>) {
  const result = createProductSchema(productsMessages[locale].validation, locale, "EUR").safeParse({
    ...valid,
    ...patch,
  });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("add product schema", () => {
  it.each(LOCALES)("accepts a complete product in %s", (locale) => {
    expect(problems(locale, {})).toEqual([]);
  });

  it.each(LOCALES)("reports an empty name with the %s sentence", (locale) => {
    expect(problems(locale, { name: " " })).toEqual([productsMessages[locale].validation.nameRequired]);
  });

  it.each(LOCALES)("reports a price with three decimals with the %s sentence", (locale) => {
    expect(problems(locale, { price: "1.234" })).toEqual([productsMessages[locale].validation.pricePattern]);
  });

  it.each(LOCALES)("reports a negative stock with the %s sentence", (locale) => {
    expect(problems(locale, { stock: "-1" })).toEqual([productsMessages[locale].validation.stockPattern]);
  });

  it.each(LOCALES)("fills the limit into the %s price sentence without a placeholder left over", (locale) => {
    expect(problems(locale, { price: "2000000" }).join("")).not.toContain("{max}");
  });
});

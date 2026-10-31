import { describe, expect, it } from "vitest";

import { chartFormatters, currencyOptions, formatAmount, formatCurrency, LOCALES } from "@/core/i18n";
import { CURRENCIES } from "@/core/money";

// Every language and currency pair: the expected text comes from Intl itself, so no string is hand-written.
const MATRIX = LOCALES.flatMap((locale) => CURRENCIES.map((currency) => [locale, currency] as const));

describe("amounts in every language and currency", () => {
  it.each(MATRIX)("%s writes %s through Intl", (locale, currency) => {
    const intl = new Intl.NumberFormat(locale, { style: "currency", currency });
    expect(formatAmount(1234.5, currency, locale)).toBe(intl.format(1234.5));
  });

  it.each(MATRIX)("%s writes whole %s amounts", (locale, currency) => {
    const intl = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
    expect(formatAmount(1234.5, currency, locale, { fractionDigits: 0 })).toBe(intl.format(1234.5));
  });

  it.each(MATRIX)("%s writes compact %s amounts", (locale, currency) => {
    const intl = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    });
    expect(formatAmount(258_600, currency, locale, { compact: true })).toBe(intl.format(258_600));
  });

  it.each(MATRIX)("%s writes %s stored in minor units", (locale, currency) => {
    const intl = new Intl.NumberFormat(locale, { style: "currency", currency });
    expect(formatCurrency(123_456, currency, locale)).toBe(intl.format(1234.56));
  });

  it.each(MATRIX)("%s chart formatters carry %s", (locale, currency) => {
    const intl = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
    expect(chartFormatters(locale, currency).currency(258_600)).toBe(intl.format(258_600));
  });
});

describe("currencyOptions", () => {
  it.each(LOCALES)("lists exactly the offered currencies in %s", (locale) => {
    expect(currencyOptions(locale).map((option) => option.value)).toEqual([...CURRENCIES]);
  });

  it.each([
    ["en", "EUR", "Euro (€)"],
    ["es", "EUR", "euro (€)"],
    ["de", "GBP", "Britisches Pfund (£)"],
    ["fr", "USD", "dollar des États-Unis ($)"],
  ] as const)("names %s %s as %s", (locale, currency, label) => {
    expect(currencyOptions(locale).find((option) => option.value === currency)?.label).toBe(label);
  });
});

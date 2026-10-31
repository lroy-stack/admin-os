/**
 * The currencies the kit offers a business. The currency is a business setting, independent of the language: the
 * locale only decides how an amount is written ("1.234,56 €" in es, "€1,234.56" in en).
 *
 * Demo semantics: a plain number in demo data is the business's books in the selected currency. Nothing converts
 * and there are no exchange rates. A real adapter supplies the currency per amount, and a `Money` value formats
 * with its own currency.
 */
export const CURRENCIES = ["USD", "EUR", "GBP"] as const;

export type Currency = (typeof CURRENCIES)[number];

/** Cookie holding the business currency. Named like the `locale` cookie. */
export const CURRENCY_COOKIE = "currency";

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

// ISO 3166 regions of the euro area; the other two currencies each have one home region.
const EURO_AREA = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
]);

/** The offered currency of an ISO 3166 region ("ES" gives EUR), or undefined when the kit offers none for it. */
export function currencyOfRegion(region: string): Currency | undefined {
  const upper = region.toUpperCase();
  if (EURO_AREA.has(upper)) {
    return "EUR";
  }
  if (upper === "GB") {
    return "GBP";
  }
  return upper === "US" ? "USD" : undefined;
}

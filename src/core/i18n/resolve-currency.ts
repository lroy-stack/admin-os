import { type Currency, currencyOfRegion, isCurrency } from "@/core/money/client";

import { languageTagsByPreference } from "./accept-language";

interface ResolveCurrencyInput {
  readonly cookie?: string | null;
  readonly acceptLanguage?: string | null;
  readonly defaultCurrency: Currency;
}

/** The region subtag of a language tag: "es-ES" gives "ES", "zh-Hant-TW" gives "TW", "de" gives undefined. */
function regionOf(tag: string): string | undefined {
  return tag.split("-").find((part, index) => index > 0 && /^([A-Za-z]{2}|\d{3})$/.test(part));
}

/**
 * Pure, like `resolveLocale`: a valid cookie, then the region of the first `Accept-Language` tag (by q) whose region
 * has an offered currency (es-ES, de-DE and fr-FR give EUR, en-GB gives GBP, en-US gives USD), then the default.
 * A tag without a region says nothing about money, so it is skipped.
 */
export function resolveCurrency({ cookie, acceptLanguage, defaultCurrency }: ResolveCurrencyInput): Currency {
  if (isCurrency(cookie)) {
    return cookie;
  }
  const fromHeader = languageTagsByPreference(acceptLanguage ?? "")
    .map((tag) => regionOf(tag))
    .map((region) => (region === undefined ? undefined : currencyOfRegion(region)))
    .find((currency) => currency !== undefined);
  return fromHeader ?? defaultCurrency;
}

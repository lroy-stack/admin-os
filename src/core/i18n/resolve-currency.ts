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
 * Pure, like `resolveLocale`: a valid cookie, then the region of the first `Accept-Language` tag (by q) that has a
 * region, then the default. If that region has no offered currency (de-CH, ja-JP), the default applies: a later tag
 * does not override the person's first regional preference (spec D6). A tag without a region says nothing about
 * money, so it is skipped.
 */
export function resolveCurrency({ cookie, acceptLanguage, defaultCurrency }: ResolveCurrencyInput): Currency {
  if (isCurrency(cookie)) {
    return cookie;
  }
  const region = languageTagsByPreference(acceptLanguage ?? "")
    .map((tag) => regionOf(tag))
    .find((candidate) => candidate !== undefined);
  return (region === undefined ? undefined : currencyOfRegion(region)) ?? defaultCurrency;
}

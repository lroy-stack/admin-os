import "server-only";

import { cache } from "react";

import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, type Locale, resolveCurrency, resolveLocale } from "@/core/i18n";
import { CURRENCY_COOKIE } from "@/core/money";

import { APP_CONFIG } from "./app-config";

/** The locale of this request: cookie, then Accept-Language, then the configured default (ADR 0007). */
export const getLocale = cache(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
    defaultLocale: APP_CONFIG.i18n.defaultLocale,
  });
});

/** The business currency of this request: cookie, then the region of Accept-Language, then the configured default. */
export const getCurrency = cache(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveCurrency({
    cookie: cookieStore.get(CURRENCY_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
    defaultCurrency: APP_CONFIG.i18n.defaultCurrency,
  });
});

/** A route's dictionary in this request's locale, for Server Components: `const text = await getMessages(messages)`. */
export async function getMessages<T>(dictionary: Readonly<Record<Locale, T>>): Promise<T> {
  return dictionary[await getLocale()];
}

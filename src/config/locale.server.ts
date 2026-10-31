import "server-only";

import { cache } from "react";

import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, resolveLocale } from "@/core/i18n";

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

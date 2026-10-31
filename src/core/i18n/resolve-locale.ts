import { languageTagsByPreference } from "./accept-language";
import { isLocale, type Locale } from "./locale";

interface ResolveLocaleInput {
  readonly cookie?: string | null;
  readonly acceptLanguage?: string | null;
  readonly defaultLocale: Locale;
}

/** Pure, so the server and tests share it: valid cookie, then `Accept-Language` by base language, then default. */
export function resolveLocale({ cookie, acceptLanguage, defaultLocale }: ResolveLocaleInput): Locale {
  if (isLocale(cookie)) {
    return cookie;
  }
  const fromHeader = languageTagsByPreference(acceptLanguage ?? "")
    .map((tag) => tag.split("-")[0]?.toLowerCase() ?? "")
    .find(isLocale);
  return fromHeader ?? defaultLocale;
}

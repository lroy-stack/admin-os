import { isLocale, type Locale } from "./locale";

interface ResolveLocaleInput {
  readonly cookie?: string | null;
  readonly acceptLanguage?: string | null;
  readonly defaultLocale: Locale;
}

/** `Accept-Language` entries ordered by q (ties keep header order); malformed or `q=0` entries are dropped. */
function languagesByPreference(header: string): string[] {
  return header
    .split(",")
    .map((entry, index) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const q = qParam === undefined ? 1 : Number(qParam.slice(2));
      return { base: tag.trim().split("-")[0]?.toLowerCase() ?? "", q, index };
    })
    .filter((entry) => entry.base !== "" && Number.isFinite(entry.q) && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((entry) => entry.base);
}

/** Pure, so the server and tests share it: valid cookie, then `Accept-Language` by base language, then default. */
export function resolveLocale({ cookie, acceptLanguage, defaultLocale }: ResolveLocaleInput): Locale {
  if (isLocale(cookie)) {
    return cookie;
  }
  const fromHeader = languagesByPreference(acceptLanguage ?? "").find(isLocale);
  return fromHeader ?? defaultLocale;
}

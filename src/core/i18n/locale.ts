export const LOCALES = ["en", "es", "de", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

/** Cookie holding the owner's language. Named like the other preference cookies (`theme_mode`, `font`, ...). */
export const LOCALE_COOKIE = "locale";

/** Each language in its own tongue, so the picker never depends on the active locale. Not a translation. */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

/** The `og:locale` of each language (Open Graph's `language_TERRITORY` form). */
export const OG_LOCALES: Readonly<Record<Locale, string>> = {
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
  fr: "fr_FR",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

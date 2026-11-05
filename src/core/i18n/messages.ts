import { formatNumber } from "./format";
import type { Locale } from "./locale";

/**
 * Plural forms keyed by CLDR category. `one` and `other` are mandatory because every locale of the kit needs them;
 * the rest are optional and fall back to `other`. Selection goes through `Intl.PluralRules`, never `n === 1`.
 */
export interface Plural {
  readonly zero?: string;
  readonly one: string;
  readonly two?: string;
  readonly few?: string;
  readonly many?: string;
  readonly other: string;
}

/** A message is plain data (a `{placeholder}` template or a `Plural`) so it can cross to client components. */
export type Message = string | Plural;

/**
 * A preset's overrides of module messages, key-major so each key is complete for all four locales by construction.
 * Keys are `<module>.<path>` into the module's messages, for example `"bookings.title"`.
 */
export type Vocabulary = Readonly<Record<string, Readonly<Record<Locale, Message>>>>;

/** The families of data a business types, which a preset may give words (`Terms`). A new family adds a key. */
export type TermFamily = "skills";

/**
 * A preset's words for data its business types, keyed by family and then by the id as the data holds it, in four
 * locales. Unlike `Vocabulary` they override no module message: a business may add ids with no words, and those show
 * as typed (`termLabel`).
 */
export type Terms = Readonly<Record<TermFamily, Readonly<Record<string, Readonly<Record<Locale, string>>>>>>;

export type MessageParams = Readonly<Record<string, string | number>>;

/** Fails to compile when a locale is missing; a missing key fails when each locale constant is typed `T`. */
export function defineMessages<T>(dictionary: Readonly<Record<Locale, T>>): Readonly<Record<Locale, T>> {
  return dictionary;
}

const PLACEHOLDER = /\{(\w+)\}/g;

export function placeholdersOf(template: string): string[] {
  return [...template.matchAll(PLACEHOLDER)].map((match) => match[1] as string);
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();

function pluralRules(locale: Locale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

function selectForm(plural: Plural, locale: Locale, count: unknown): string {
  if (typeof count !== "number") {
    throw new TypeError("A plural message needs a numeric `count` param.");
  }
  // An explicit `zero` wins over the locale's category (fr would otherwise treat 0 as `one`).
  if (count === 0 && plural.zero !== undefined) {
    return plural.zero;
  }
  return plural[pluralRules(locale).select(count)] ?? plural.other;
}

const written = (value: string | number, locale: Locale) =>
  typeof value === "number" ? formatNumber(value, locale) : value;

/**
 * Picks the plural form (when any) and fills `{name}` placeholders. Unknown placeholders are left visible. A numeric
 * param is written for the locale after the plural is chosen ("1,234" in English, "1.234" in German), so the plural
 * rules see the raw number; pass a string to print a value exactly as it is (a year, an id).
 */
export function format(message: Message, locale: Locale, params: MessageParams = {}): string {
  const template = typeof message === "string" ? message : selectForm(message, locale, params.count);
  return template.replace(PLACEHOLDER, (whole, name: string) => {
    const value = params[name];
    return value === undefined ? whole : written(value, locale);
  });
}

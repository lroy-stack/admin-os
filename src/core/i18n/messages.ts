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

/** Picks the plural form (when any) and fills `{name}` placeholders. Unknown placeholders are left visible. */
export function format(message: Message, locale: Locale, params: MessageParams = {}): string {
  const template = typeof message === "string" ? message : selectForm(message, locale, params.count);
  return template.replace(PLACEHOLDER, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

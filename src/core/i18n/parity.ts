import { LOCALES, type Locale } from "./locale";
import { type Message, placeholdersOf } from "./messages";

const PLURAL_KEYS = new Set(["zero", "one", "two", "few", "many", "other"]);

function isPluralLike(value: object): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => PLURAL_KEYS.has(key));
}

/** Flattens a nested dictionary into `path -> Message`; a plain object of plural keys is a leaf, not a branch. */
function flatten(node: unknown, path: string, out: Map<string, Message>): void {
  if (typeof node === "string") {
    out.set(path, node);
  } else if (typeof node === "object" && node !== null) {
    if (isPluralLike(node)) {
      out.set(path, node as Message);
    } else {
      for (const [key, child] of Object.entries(node)) {
        flatten(child, path === "" ? key : `${path}.${key}`, out);
      }
    }
  }
}

function formsOf(message: Message): string[] {
  return typeof message === "string" ? [message] : Object.values(message).filter((v) => typeof v === "string");
}

/** The sorted, comma-joined set of `{placeholders}` across all forms of a message. */
export function placeholderSignature(message: Message): string {
  return [...new Set(formsOf(message).flatMap(placeholdersOf))].sort().join(",");
}

/** Flattens a dictionary into `path -> Message`, so callers can compare keys and placeholders across dictionaries. */
export function flattenMessages(dictionary: unknown): Map<string, Message> {
  const out = new Map<string, Message>();
  flatten(dictionary, "", out);
  return out;
}

// French typography (docs/i18n/glossary.md): a no-break space before : ; ? ! and before % after a number, and
// typographic apostrophes. U+00A0 is the no-break space, U+202F the narrow one.
const FRENCH_PLAIN_SPACE_BEFORE_PUNCTUATION = / [:;?!]/;
// No space at all. A colon in "https://x" or "10:30" is not a sentence colon, so it is left alone.
const FRENCH_NO_SPACE_BEFORE_PUNCTUATION = /[^\s\u00a0\u202f](?:[;?!]|:(?!\/\/|\d))/;
const PERCENT_WITHOUT_NO_BREAK_SPACE = /[\d}] ?%/;
const STRAIGHT_APOSTROPHE = /'/;

function problemsFor(locale: Locale, path: string, message: Message): string[] {
  const where = `${locale}:${path}`;
  const texts = formsOf(message);
  const problems = texts.filter((text) => text.trim() === "").map(() => `${where} has an empty string`);
  if (locale === "fr") {
    for (const text of texts) {
      if (FRENCH_PLAIN_SPACE_BEFORE_PUNCTUATION.test(text)) {
        problems.push(`${where} has a plain space before : ; ? or !; use a no-break space (U+00A0)`);
      }
      if (FRENCH_NO_SPACE_BEFORE_PUNCTUATION.test(text)) {
        problems.push(`${where} has no space before : ; ? or !; put a no-break space (U+00A0) before it`);
      }
      if (PERCENT_WITHOUT_NO_BREAK_SPACE.test(text)) {
        problems.push(`${where} needs a no-break space (U+00A0 or U+202F) between a number and %`);
      }
      if (STRAIGHT_APOSTROPHE.test(text)) {
        problems.push(`${where} has a straight apostrophe; use ’ (U+2019)`);
      }
    }
  }
  if (typeof message !== "string") {
    for (const required of ["one", "other"] as const) {
      if (typeof message[required] !== "string") {
        problems.push(`${where} plural is missing "${required}"`);
      }
    }
  }
  return problems;
}

function sameInEveryLocale(messages: readonly Message[]): boolean {
  const canonical = (message: Message) =>
    typeof message === "string" ? message : JSON.stringify(Object.entries(message).sort());
  return new Set(messages.map(canonical)).size === 1;
}

/**
 * Runtime half of ADR 0007's completeness (the compiler covers the other half). Throws one error listing every
 * problem: missing locale or key, empty string, differing `{placeholders}`, a plural without `one`/`other`, a message
 * identical in all four locales (an untranslated copy), or French typography broken (a plain or missing space before
 * : ; ? !, no no-break space before % after a number, a straight apostrophe). `allowIdentical` lists the paths that
 * may match in every locale, such as brand names.
 */
export function assertDictionaryParity(
  dictionary: Readonly<Record<Locale, unknown>>,
  allowIdentical: readonly string[] = [],
): void {
  const problems: string[] = [];
  const flat = new Map<Locale, Map<string, Message>>();
  for (const locale of LOCALES) {
    if (dictionary[locale] === undefined) {
      problems.push(`locale "${locale}" is missing`);
    } else {
      const entries = new Map<string, Message>();
      flatten(dictionary[locale], "", entries);
      flat.set(locale, entries);
    }
  }
  const paths = new Set([...flat.values()].flatMap((entries) => [...entries.keys()]));
  for (const path of paths) {
    const signatures = new Set<string>();
    for (const [locale, entries] of flat) {
      const message = entries.get(path);
      if (message === undefined) {
        problems.push(`${locale}:${path} is missing`);
      } else {
        problems.push(...problemsFor(locale, path, message));
        signatures.add(placeholderSignature(message));
      }
    }
    if (signatures.size > 1) {
      problems.push(`${path} has different placeholders across locales`);
    }
    const everyLocale = [...flat.values()].flatMap((entries) => entries.get(path) ?? []);
    if (everyLocale.length === LOCALES.length && sameInEveryLocale(everyLocale) && !allowIdentical.includes(path)) {
      problems.push(`${path} is identical in all locales; translate it or add it to the allow-list`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Dictionary parity failed:\n- ${problems.join("\n- ")}`);
  }
}

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

function placeholderSignature(message: Message): string {
  return [...new Set(formsOf(message).flatMap(placeholdersOf))].sort().join(",");
}

function problemsFor(locale: Locale, path: string, message: Message): string[] {
  const where = `${locale}:${path}`;
  const problems = formsOf(message)
    .filter((text) => text.trim() === "")
    .map(() => `${where} has an empty string`);
  if (typeof message !== "string") {
    for (const required of ["one", "other"] as const) {
      if (typeof message[required] !== "string") {
        problems.push(`${where} plural is missing "${required}"`);
      }
    }
  }
  return problems;
}

/**
 * Runtime half of ADR 0007's completeness (the compiler covers the other half). Throws one error listing every
 * problem: missing locale or key, empty string, differing `{placeholders}`, or a plural without `one`/`other`.
 */
export function assertDictionaryParity(dictionary: Readonly<Record<Locale, unknown>>): void {
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
  }
  if (problems.length > 0) {
    throw new Error(`Dictionary parity failed:\n- ${problems.join("\n- ")}`);
  }
}

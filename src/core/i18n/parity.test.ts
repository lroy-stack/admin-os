import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

const ok = (text: string) => ({ title: text, count: { one: `{count} ${text}`, other: `{count} ${text}s` } });
const complete = { en: ok("A"), es: ok("B"), de: ok("C"), fr: ok("D") };

describe("assertDictionaryParity", () => {
  it("accepts a complete dictionary", () => {
    expect(() => assertDictionaryParity(complete)).not.toThrow();
  });

  it.each([
    ["a missing locale", { ...complete, fr: undefined }, 'locale "fr" is missing'],
    ["a missing key", { ...complete, de: { title: "C" } }, "de:count is missing"],
    ["an empty string", { ...complete, es: { ...ok("B"), title: "  " } }, "es:title has an empty string"],
    [
      "different placeholders",
      { ...complete, de: { ...ok("A"), title: "Hi {name}" }, en: { ...ok("A"), title: "Hi {user}" } },
      "title has different placeholders",
    ],
    [
      "a plural without one",
      { ...complete, fr: { ...ok("D"), count: { other: "{count} b" } } },
      'fr:count plural is missing "one"',
    ],
    [
      "a plural without other",
      { ...complete, fr: { ...ok("D"), count: { one: "{count} a" } } },
      'fr:count plural is missing "other"',
    ],
  ] as const)("rejects %s", (_name, dictionary, message) => {
    expect(() => assertDictionaryParity(dictionary as never)).toThrow(message);
  });
});

describe("untranslated messages", () => {
  const untranslated = { en: ok("A"), es: ok("A"), de: ok("A"), fr: ok("A") };

  it("rejects a message identical in all four locales", () => {
    expect(() => assertDictionaryParity(untranslated)).toThrow("title is identical in all locales");
  });

  it("rejects an identical plural", () => {
    expect(() => assertDictionaryParity(untranslated)).toThrow("count is identical in all locales");
  });

  it("accepts an allow-listed path", () => {
    expect(() => assertDictionaryParity(untranslated, ["title", "count"])).not.toThrow();
  });

  it("accepts a message that differs in one locale", () => {
    expect(() => assertDictionaryParity({ ...untranslated, fr: ok("D") })).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

const ok = (text: string) => ({ title: text, count: { one: "{count} a", other: "{count} b" } });
const complete = { en: ok("A"), es: ok("A"), de: ok("A"), fr: ok("A") };

describe("assertDictionaryParity", () => {
  it("accepts a complete dictionary", () => {
    expect(() => assertDictionaryParity(complete)).not.toThrow();
  });

  it.each([
    ["a missing locale", { ...complete, fr: undefined }, 'locale "fr" is missing'],
    ["a missing key", { ...complete, de: { title: "A" } }, "de:count is missing"],
    ["an empty string", { ...complete, es: { ...ok("A"), title: "  " } }, "es:title has an empty string"],
    [
      "different placeholders",
      { ...complete, de: { ...ok("A"), title: "Hi {name}" }, en: { ...ok("A"), title: "Hi {user}" } },
      "title has different placeholders",
    ],
    [
      "a plural without one",
      { ...complete, fr: { ...ok("A"), count: { other: "{count} b" } } },
      'fr:count plural is missing "one"',
    ],
    [
      "a plural without other",
      { ...complete, fr: { ...ok("A"), count: { one: "{count} a" } } },
      'fr:count plural is missing "other"',
    ],
  ] as const)("rejects %s", (_name, dictionary, message) => {
    expect(() => assertDictionaryParity(dictionary as never)).toThrow(message);
  });
});

import { describe, expect, it } from "vitest";

import { defineMessages, messageKey, resolveMessages } from "@/core/i18n";

interface Demo {
  readonly title: string;
}

const key = messageKey<Demo>("demo");
const dictionary = defineMessages<Demo>({
  en: { title: "Hello" },
  es: { title: "Hola" },
  de: { title: "Hallo" },
  fr: { title: "Bonjour" },
});

describe("resolveMessages", () => {
  it.each([
    ["en", "Hello"],
    ["es", "Hola"],
    ["de", "Hallo"],
    ["fr", "Bonjour"],
  ] as const)("keeps only the %s dictionary under its namespace", (locale, title) => {
    expect(resolveMessages(locale, { key, dictionary })).toEqual({ demo: { title } });
  });
});

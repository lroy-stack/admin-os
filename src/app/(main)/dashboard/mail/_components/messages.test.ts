import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { createMails, MAIL_IDS } from "./data";
import { mailMessages } from "./messages.server";

// Identical on purpose: the emoji word, the app file name and the title-with-count join are the same everywhere.
const SAME_EVERYWHERE = ["view.emoji", "demo.attachments.admin-os-fig", "inbox.groupTitle"];

describe("mail dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(mailMessages, SAME_EVERYWHERE)).not.toThrow();
  });

  it.each(LOCALES)("writes every demo mail and attachment in %s", (locale) => {
    const mails = createMails(Date.UTC(2026, 9, 31), mailMessages[locale], locale);

    expect(mails.map((mail) => mail.id)).toEqual([...MAIL_IDS]);
    expect(mails.every((mail) => mail.subject !== "" && mail.body !== "")).toBe(true);
  });

  it.each([
    { locale: "en", unit: /MB$/ },
    { locale: "fr", unit: /Mo$/ },
  ] as const)("ends a size in $locale with its unit", ({ locale, unit }) => {
    const [first] = createMails(Date.UTC(2026, 9, 31), mailMessages[locale], locale);

    expect(first?.attachments?.[1]?.size).toMatch(unit);
  });
});

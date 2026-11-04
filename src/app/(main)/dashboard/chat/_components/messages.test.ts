import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { CHAT_NOW, CONVERSATION_IDS, createConversations, listTime, messageTime } from "./data";
import { chatMessages } from "./messages.server";

// Identical on purpose: brand names, the app's own words for Chat, the emoji label, the count in parentheses, and
// technical tags that every language reads the same.
const SAME_EVERYWHERE = [
  "header.title",
  "channels.chat",
  "channels.whatsapp",
  "channels.instagram",
  "channels.facebook",
  "list.tabCount",
  "tags.devops",
  "tags.enterprise",
  "tags.p0",
  "tags.iam",
  "tags.onboarding",
  "tags.api",
  "tags.ssl",
  "tags.zapier",
  "tags.rbac",
  "tags.android",
  "tags.latam",
  "tags.mfa",
  "tags.sso",
  "tags.azure",
];

describe("chat dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(chatMessages, SAME_EVERYWHERE)).not.toThrow();
  });

  it.each(LOCALES)("writes every demo conversation in %s", (locale) => {
    const conversations = createConversations(chatMessages[locale], locale);

    expect(conversations.map((conversation) => conversation.id)).toEqual([...CONVERSATION_IDS]);
    expect(conversations.every((conversation) => conversation.messages.length > 0)).toBe(true);
  });
});

// Newer ICU versions put a narrow no-break space before "AM"; the test compares plain spaces.
const plain = (text: string) => text.replace(/\s/g, " ");
const minutesBefore = (minutes: number) => CHAT_NOW - minutes * 60_000;

describe("chat times", () => {
  it.each([
    { minutes: 1, expected: "Just now" },
    { minutes: 5, expected: "5m" },
    { minutes: 78, expected: "10:42 AM" },
    { minutes: 24 * 60, expected: "Yesterday" },
  ])("shows $expected in the list for a message $minutes minutes old", ({ minutes, expected }) => {
    expect(plain(listTime(minutesBefore(minutes), CHAT_NOW, "en", chatMessages.en.time))).toBe(expected);
  });

  it.each([
    { minutes: 10, expected: "10 minutes ago" },
    { minutes: 78, expected: "10:42 AM" },
    { minutes: 24 * 60, expected: "Yesterday" },
  ])("shows $expected under a message $minutes minutes old", ({ minutes, expected }) => {
    expect(plain(messageTime(minutesBefore(minutes), CHAT_NOW, "en", chatMessages.en.time))).toBe(expected);
  });
});

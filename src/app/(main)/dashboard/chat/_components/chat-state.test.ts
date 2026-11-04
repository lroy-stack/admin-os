import { describe, expect, it } from "vitest";

import {
  activeConversation,
  appendMessage,
  createConversation,
  entryOf,
  INITIAL_CHAT_STATE,
  inScope,
  resolveConversations,
  restoreEntry,
  selectConversation,
  setFilter,
  setQuery,
  setScope,
  setTab,
  tabCounts,
  unreadIn,
  visibleConversations,
} from "./chat-state";
import { createConversations } from "./data";
import { chatMessages } from "./messages.server";

const base = createConversations(chatMessages.en, "en");
const ids = (list: readonly { id: number }[]) => list.map((item) => item.id);
const visible = (state = INITIAL_CHAT_STATE) => visibleConversations(resolveConversations(base, state), state);
const WORDS = { time: "Just now", day: "Today", status: "Lead" };

describe("scope", () => {
  it("shows every open conversation in the inbox", () => {
    expect(visible()).toHaveLength(base.length);
  });

  it("shows only the conversations of a channel", () => {
    const state = setScope(INITIAL_CHAT_STATE, { kind: "channel", id: "whatsapp" });

    expect(visible(state).every((conversation) => conversation.channel === "whatsapp")).toBe(true);
    expect(visible(state).length).toBeGreaterThan(0);
  });

  it.each([
    { view: "vip" as const, tag: "enterprise" as const },
    { view: "orders" as const, tag: "billing" as const },
    { view: "feedback" as const, tag: "bug" as const },
  ])("puts a contact tagged $tag in the $view view", ({ view, tag }) => {
    const tagged = base.find((conversation) => conversation.tagIds.includes(tag));

    expect(tagged && inScope(tagged, { kind: "view", id: view })).toBe(true);
  });

  it("keeps a conversation out of a view its tags do not belong to", () => {
    const untagged = base.find((conversation) => conversation.tagIds.includes("devops"));

    expect(untagged && inScope(untagged, { kind: "view", id: "orders" })).toBe(false);
  });

  it("shows nothing in Snoozed until something is snoozed", () => {
    expect(visible(setScope(INITIAL_CHAT_STATE, { kind: "nav", id: "snoozed" }))).toEqual([]);
  });

  it("starts from the whole list of the new scope", () => {
    const state = setScope(setTab(INITIAL_CHAT_STATE, "closed"), { kind: "nav", id: "all" });

    expect(state.tab).toBe("all");
  });

  it("shows the conversations whose last message came from the team in Sent", () => {
    const sent = visible(setScope(INITIAL_CHAT_STATE, { kind: "nav", id: "sent" }));

    expect(sent.every((conversation) => conversation.messages.at(-1)?.align === "end")).toBe(true);
  });
});

describe("tabs, search and filter", () => {
  it("shows no closed conversation in the list of open ones", () => {
    expect(visible(setTab(INITIAL_CHAT_STATE, "closed"))).toEqual([]);
  });

  it("counts the conversations of each tab", () => {
    expect(tabCounts(resolveConversations(base, INITIAL_CHAT_STATE), INITIAL_CHAT_STATE)).toEqual({
      all: base.length,
      open: base.length,
      snoozed: 0,
      closed: 0,
    });
  });

  it.each([
    { query: "olivia", expected: [1] },
    { query: "  RAILWAY  ", expected: [1] },
    { query: "no-such-word", expected: [] },
  ])("finds $expected for the query '$query'", ({ query, expected }) => {
    expect(ids(visible(setQuery(INITIAL_CHAT_STATE, query)))).toEqual(expected);
  });

  it("keeps only the unread conversations when asked", () => {
    const state = setFilter(INITIAL_CHAT_STATE, { unread: true, priority: false });

    expect(visible(state).every((conversation) => conversation.isUnread)).toBe(true);
    expect(visible(state).length).toBeLessThan(base.length);
  });

  it("shows nothing when only priority conversations are asked for and none is", () => {
    expect(visible(setFilter(INITIAL_CHAT_STATE, { unread: false, priority: true }))).toEqual([]);
  });
});

describe("opening a conversation", () => {
  it("clears its unread badge and selects it", () => {
    const state = selectConversation(INITIAL_CHAT_STATE, 1);
    const [opened] = resolveConversations(base, state);

    expect([state.selected, opened?.isUnread, opened?.unreadCount]).toEqual([1, false, 0]);
  });

  it("lowers the unread count of the scope", () => {
    const scope = INITIAL_CHAT_STATE.scope;
    const before = unreadIn(resolveConversations(base, INITIAL_CHAT_STATE), scope);
    const after = unreadIn(resolveConversations(base, selectConversation(INITIAL_CHAT_STATE, 1)), scope);

    expect(before - after).toBe(1);
  });

  it("shows the selected conversation even when the list no longer holds it", () => {
    const state = setQuery(INITIAL_CHAT_STATE, "no-such-word");
    const all = resolveConversations(base, state);

    expect(activeConversation(all, visibleConversations(all, state), state)?.id).toBe(1);
  });

  it("shows no conversation when none is selected and the list is empty", () => {
    const state = { ...setQuery(INITIAL_CHAT_STATE, "no-such-word"), selected: null };
    const all = resolveConversations(base, state);

    expect(activeConversation(all, visibleConversations(all, state), state)).toBeNull();
  });
});

describe("sending", () => {
  it("appends a reply to the thread and makes it the preview", () => {
    const state = appendMessage(INITIAL_CHAT_STATE, 1, { kind: "reply", text: "On my way", time: "Just now" });
    const [updated] = resolveConversations(base, state);

    expect(updated?.messages.at(-1)).toMatchObject({ text: "On my way", align: "end", kind: undefined });
    expect([updated?.preview, updated?.time]).toEqual(["On my way", "Just now"]);
  });

  it("appends a note as a note and leaves the preview alone", () => {
    const state = appendMessage(INITIAL_CHAT_STATE, 1, { kind: "note", text: "Check billing", time: "Just now" });
    const [updated] = resolveConversations(base, state);

    expect(updated?.messages.at(-1)).toMatchObject({ text: "Check billing", kind: "note" });
    expect(updated?.preview).toBe(base[0]?.preview);
  });

  it("gives every message its own id", () => {
    const twice = appendMessage(
      appendMessage(INITIAL_CHAT_STATE, 1, { kind: "reply", text: "One", time: "Just now" }),
      1,
      { kind: "reply", text: "Two", time: "Just now" },
    );
    const [updated] = resolveConversations(base, twice);

    expect(updated?.messages.slice(-2).map((message) => message.id)).toEqual([100_000, 100_001]);
  });

  it("puts the conversation in Sent once the team had the last word", () => {
    const state = appendMessage(INITIAL_CHAT_STATE, 1, { kind: "reply", text: "Done", time: "Just now" });
    const sent = visible(setScope(state, { kind: "nav", id: "sent" }));

    expect(ids(sent)).toContain(1);
  });
});

describe("a new conversation", () => {
  const started = createConversation(INITIAL_CHAT_STATE, {
    name: "Bea Costa",
    email: "bea@example.com",
    channel: "phone",
    subject: "Table for eight",
    message: "Hello Bea",
    words: WORDS,
  });

  it("is selected and listed with its first message", () => {
    const [added] = resolveConversations(base, started).slice(-1);

    expect([started.selected, added?.name, added?.messages.map((message) => message.text)]).toEqual([
      1000,
      "Bea Costa",
      ["Hello Bea"],
    ]);
  });

  it("is on the list the person sees, whatever view they were in", () => {
    const filtered = setQuery(setScope(INITIAL_CHAT_STATE, { kind: "channel", id: "email" }), "olivia");
    const after = createConversation(filtered, {
      name: "Bea Costa",
      email: "",
      channel: "phone",
      subject: "Table",
      message: "Hi",
      words: WORDS,
    });

    expect(ids(visible(after))).toContain(after.selected);
  });

  it("starts with the contact fields the person typed and blanks for the rest", () => {
    const [added] = resolveConversations(base, started).slice(-1);

    expect(added?.contact).toMatchObject({ name: "Bea Costa", email: "bea@example.com", company: "", status: "Lead" });
  });
});

describe("undo", () => {
  it("puts back the entry a conversation had before it was changed", () => {
    const before = entryOf(INITIAL_CHAT_STATE, 1);
    const changed = appendMessage(INITIAL_CHAT_STATE, 1, { kind: "reply", text: "Hi", time: "Just now" });

    expect(restoreEntry(changed, 1, before).entries).toEqual({});
  });
});

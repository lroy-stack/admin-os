import { describe, expect, it } from "vitest";

import { createMails, MAIL_IDS } from "./data";
import {
  displayOrder,
  entryOf,
  focusMail,
  INITIAL_MAIL_STATE,
  markUnread,
  moveTo,
  neighbour,
  nextAfterRemoval,
  resolveMails,
  restoreEntry,
  selectMail,
  setFolder,
  setQuery,
  setSort,
  toggleLabel,
  togglePin,
  unreadIn,
  visibleMails,
} from "./mail-state";
import { mailMessages } from "./messages.server";

const NOW = Date.UTC(2026, 9, 31);
const base = createMails(NOW, mailMessages.en, "en");
const [first, second, third] = MAIL_IDS;
const mailOf = (id: string) => {
  const mail = base.find((item) => item.id === id);
  if (!mail) throw new Error(`No demo mail ${id}`);
  return mail;
};

describe("folders", () => {
  it("shows the inbox first, newest message first", () => {
    const ids = visibleMails(base, INITIAL_MAIL_STATE).map((mail) => mail.id);

    expect(ids.slice(0, 3)).toEqual([first, second, third]);
  });

  it("keeps only the priority messages of the inbox in Priority", () => {
    const state = setFolder(INITIAL_MAIL_STATE, "priority", base);

    expect(visibleMails(base, state).map((mail) => mail.id)).toEqual([
      first,
      "61c35085-72d7-42b4-8d62-738f700d4b92",
      "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97",
    ]);
  });

  it("shows nothing in a folder that holds nothing", () => {
    expect(visibleMails(base, setFolder(INITIAL_MAIL_STATE, "sent", base))).toEqual([]);
  });

  it("drops the selection when the message is not in the new folder", () => {
    expect(setFolder(INITIAL_MAIL_STATE, "trash", base).selected).toBeNull();
  });

  it("keeps the selection when the message is in the new folder", () => {
    expect(setFolder(INITIAL_MAIL_STATE, "priority", base).selected).toBe(first);
  });

  it("moves a message to the archive, out of the inbox and the priority list", () => {
    const state = moveTo(INITIAL_MAIL_STATE, first, "archive");
    const resolved = resolveMails(base, state);

    expect(visibleMails(resolved, INITIAL_MAIL_STATE).map((mail) => mail.id)).not.toContain(first);
    expect(visibleMails(resolved, setFolder(state, "archive", resolved)).map((mail) => mail.id)).toEqual([first]);
  });
});

describe("search and sort", () => {
  it.each([
    { query: "hiking", expected: ["3e7c3f6d-bdf5-46ae-8d90-171300f27ae2"] },
    { query: "  SAMUEL  ", expected: ["6c9a7f94-8329-4d70-95d3-51f68c186ae1"] },
    { query: "nothing-matches-this", expected: [] },
  ])("finds $expected for the query '$query'", ({ query, expected }) => {
    const state = setQuery(INITIAL_MAIL_STATE, query);

    expect(visibleMails(base, state).map((mail) => mail.id)).toEqual(expected);
  });

  it("lists the oldest first when asked", () => {
    const [oldest] = visibleMails(base, setSort(INITIAL_MAIL_STATE, "oldest"));

    expect(oldest?.id).toBe("6c9a7f94-8329-4d70-95d3-51f68c186ae1");
  });

  it("lists unread messages first, newest first within each group", () => {
    const [head] = visibleMails(base, setSort(INITIAL_MAIL_STATE, "unread"));

    expect(head?.isRead).toBe(false);
  });
});

describe("next and previous", () => {
  const order = displayOrder(visibleMails(base, INITIAL_MAIL_STATE));

  it("reads the pinned messages first", () => {
    expect(order.slice(0, 4).map((mail) => mail.isPinned)).toEqual([true, true, true, true]);
  });

  it.each([
    { from: first, step: 1 as const, expected: second },
    { from: second, step: -1 as const, expected: first },
    { from: first, step: -1 as const, expected: null },
    { from: "6c9a7f94-8329-4d70-95d3-51f68c186ae1", step: 1 as const, expected: null },
    { from: "unknown", step: 1 as const, expected: null },
  ])("steps $step from $from to $expected", ({ from, step, expected }) => {
    expect(neighbour(order, from, step)).toBe(expected);
  });

  it.each([
    { removed: first, expected: second },
    { removed: "6c9a7f94-8329-4d70-95d3-51f68c186ae1", expected: "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d" },
  ])("selects $expected after $removed leaves the list", ({ removed, expected }) => {
    expect(nextAfterRemoval(order, removed)).toBe(expected);
  });

  it("selects nothing when the only message leaves", () => {
    expect(nextAfterRemoval([mailOf(first)], first)).toBeNull();
  });
});

describe("message actions", () => {
  it("marks a message read when it is opened", () => {
    const unread = "61c35085-72d7-42b4-8d62-738f700d4b92";
    const state = selectMail(INITIAL_MAIL_STATE, unread);

    expect(resolveMails(base, state).find((mail) => mail.id === unread)?.isRead).toBe(true);
    expect(state.selected).toBe(unread);
  });

  it("marks a message unread again", () => {
    const state = markUnread(INITIAL_MAIL_STATE, first);

    expect(resolveMails(base, state).find((mail) => mail.id === first)?.isRead).toBe(false);
  });

  it("unpins a pinned message and pins it back", () => {
    const unpinned = togglePin(INITIAL_MAIL_STATE, mailOf(first));
    const repinned = togglePin(unpinned, resolveMails(base, unpinned)[0] ?? mailOf(first));

    expect(resolveMails(base, unpinned)[0]?.isPinned).toBe(false);
    expect(resolveMails(base, repinned)[0]?.isPinned).toBe(true);
  });

  it("adds a label and removes it again", () => {
    const added = toggleLabel(INITIAL_MAIL_STATE, mailOf(first), "travel");
    const removed = toggleLabel(added, resolveMails(base, added)[0] ?? mailOf(first), "travel");

    expect(resolveMails(base, added)[0]?.labels).toEqual(["meeting", "work", "important", "travel"]);
    expect(resolveMails(base, removed)[0]?.labels).toEqual(["meeting", "work", "important"]);
  });

  it("counts the unread messages of a folder", () => {
    expect(unreadIn(base, "inbox")).toBe(8);
    expect(unreadIn(base, "priority")).toBe(2);
    expect(unreadIn(base, "trash")).toBe(0);
  });
});

describe("undo", () => {
  it("puts back the entry a message had before it was trashed", () => {
    const before = entryOf(INITIAL_MAIL_STATE, first);
    const trashed = moveTo(INITIAL_MAIL_STATE, first, "trash");

    expect(restoreEntry(trashed, first, before).entries).toEqual({});
  });

  it("keeps the earlier changes when it restores a later one", () => {
    const read = markUnread(INITIAL_MAIL_STATE, first);
    const before = entryOf(read, first);
    const trashed = moveTo(read, first, "trash");

    expect(entryOf(restoreEntry(trashed, first, before), first)).toEqual({ isRead: false });
  });

  it("selects the restored message without reading it", () => {
    const state = focusMail(markUnread(INITIAL_MAIL_STATE, first), first);

    expect(resolveMails(base, state)[0]?.isRead).toBe(false);
  });
});

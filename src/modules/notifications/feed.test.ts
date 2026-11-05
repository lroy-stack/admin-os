import { describe, expect, it } from "vitest";

import { notificationRow, notificationsFeed, textAt } from "./feed";
import { notificationsMessages } from "./messages";
import type { Notification } from "./schema";

const booking: Notification = {
  id: "booking.new:R-1043",
  kind: "booking.new",
  titleKey: "notifications.kinds.bookingNew.title",
  bodyKey: "notifications.kinds.bookingNew.body",
  params: { name: "Ortega", partySize: 4, time: "21:00" },
  createdAt: { day: "2026-10-31", minute: 1200 },
};

const read: Notification = { ...booking, id: "booking.new:R-1044", readAt: { day: "2026-10-31", minute: 1211 } };

describe("notificationRow", () => {
  it("words a booking notification in the locale and marks it unread", () => {
    expect(notificationRow(booking, notificationsMessages.en, "en")).toEqual({
      id: "booking.new:R-1043",
      kind: "booking.new",
      title: "New booking",
      body: "Ortega, party of 4, at 21:00.",
      unread: true,
    });
  });

  it("carries the reading state", () => {
    expect(notificationRow(read, notificationsMessages.es, "es")).toMatchObject({ unread: false });
  });
});

describe("the notifications feed", () => {
  const page = { items: [booking, read], nextCursor: null, unreadCount: 1 };

  it("words the rows of a page of notifications.list in the locale, newest first as listed", () => {
    expect(notificationsFeed.rows(page, "en")?.map(({ id, unread }) => [id, unread])).toEqual([
      ["booking.new:R-1043", true],
      ["booking.new:R-1044", false],
    ]);
  });

  it("answers undefined for a value that is not a page of notifications", () => {
    expect(notificationsFeed.rows({ items: [{ id: "x" }] }, "en")).toBeUndefined();
  });
});

describe("textAt", () => {
  it("finds the template a key names", () => {
    expect(textAt(notificationsMessages.en, "notifications.kinds.bookingLate.title")).toBe("Late arrival");
  });

  it.each([
    ["a key outside the dictionary", "bookings.kinds.bookingLate.title", /outside the notifications dictionary/],
    ["a key that names no message", "notifications.kinds.unknown.title", /names no message/],
    ["a key that stops at a group", "notifications.kinds.bookingLate", /names no message/],
  ])("refuses %s", (_case, key, message) => {
    expect(() => textAt(notificationsMessages.en, key)).toThrow(message);
  });
});

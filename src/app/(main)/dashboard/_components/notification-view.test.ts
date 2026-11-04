import { describe, expect, it } from "vitest";

import type { Notification } from "@/modules/notifications";
import { notificationsMessages } from "@/modules/notifications/server";

import { notificationView, textAt } from "./notification-view";

const booking: Notification = {
  id: "booking.new:R-1043",
  kind: "booking.new",
  titleKey: "notifications.kinds.bookingNew.title",
  bodyKey: "notifications.kinds.bookingNew.body",
  params: { name: "Ortega", partySize: 4, time: "21:00" },
  createdAt: { day: "2026-10-31", minute: 1200 },
};

const held: Notification = {
  id: "approval.requested:apr-1",
  kind: "approval.requested",
  titleKey: "notifications.kinds.approvalRequested.title",
  bodyKey: "notifications.kinds.approvalRequested.body.bookingsCancel",
  params: { capability: "bookings.cancel", target: "R-1046" },
  createdAt: { day: "2026-10-31", minute: 1210 },
  readAt: { day: "2026-10-31", minute: 1211 },
  link: { entity: "approval", id: "apr-1" },
};

describe("notificationView", () => {
  it("words a booking notification in the locale and marks it unread", () => {
    expect(notificationView(booking, notificationsMessages.en, "en")).toEqual({
      id: "booking.new:R-1043",
      kind: "booking.new",
      title: "New booking",
      body: "Ortega, party of 4, at 21:00.",
      unread: true,
    });
  });

  it("carries the approval id of a held write and its reading state", () => {
    expect(notificationView(held, notificationsMessages.es, "es")).toMatchObject({
      approvalId: "apr-1",
      unread: false,
      body: expect.stringContaining("R-1046"),
    });
  });

  it("keeps a booking without a link free of an approval id", () => {
    expect(notificationView(booking, notificationsMessages.en, "en")).not.toHaveProperty("approvalId");
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

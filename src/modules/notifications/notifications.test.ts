import { describe, expect, it } from "vitest";

import { descriptorViolations } from "@/core/capability";
import type { BusinessClock } from "@/core/clock";
import { assertDictionaryParity, flattenMessages, LOCALES, placeholderSignature } from "@/core/i18n";
import type { BookingInput } from "@/modules/bookings";

import { notificationsCapabilities } from "./capabilities";
import { deriveNotifications, type FeedSource, timeLabel } from "./derive";
import { notificationsMessages } from "./messages";
import { notificationSchema, notificationsReadInput } from "./schema";

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 20 * 60,
  cutoffMin: 5 * 60,
  timeZone: "Europe/Madrid",
};
const rules = { soonMinutes: 30, lateAfterMinutes: 10 };

const booking = (overrides: Partial<BookingInput> & Pick<BookingInput, "id" | "startMin">): BookingInput => ({
  status: "confirmed",
  businessDay: "2026-10-31",
  endMin: overrides.startMin + 90,
  resourceIds: [],
  staffIds: [],
  contactName: "Ada",
  partySize: 2,
  lines: [],
  origin: "staff",
  tags: [],
  ...overrides,
});

const source = (bookings: BookingInput[]): FeedSource => ({ bookings, customers: [{ id: "c1", name: "Grace" }] });
const idsOf = (bookings: BookingInput[]) => deriveNotifications(source(bookings), clock, rules).map((n) => n.id);

describe("notification schemas", () => {
  it("accepts an item made of message keys, params and a link", () => {
    const item = {
      id: "booking.soon:b1",
      kind: "booking.soon",
      titleKey: "notifications.kinds.bookingSoon.title",
      bodyKey: "notifications.kinds.bookingSoon.body",
      params: { name: "Ada", minutes: 15 },
      createdAt: { day: "2026-10-31", minute: 1170 },
      link: { entity: "booking", id: "b1" },
    };
    expect(notificationSchema.parse(item)).toEqual(item);
  });

  it.each([{ ids: [] }, { ids: [""] }, {}, { ids: ["a"], extra: 1 }])("rejects the read input %j", (input) => {
    expect(notificationsReadInput.safeParse(input).success).toBe(false);
  });
});

describe("notification capabilities", () => {
  it.each(Object.values(notificationsCapabilities))("$id breaks no descriptor rule", (capability) => {
    expect(descriptorViolations(capability)).toEqual([]);
  });

  it.each([
    ["notifications.list", "read:notifications", "read", 1],
    ["notifications.unread.count", "read:notifications", "read", 1],
    ["notifications.read", "update:notifications", "write", 1],
    ["notifications.read_all", "update:notifications", "write", 1],
  ] as const)("declares %s as %s, %s, tier %s", (id, permission, effect, riskTier) => {
    expect(notificationsCapabilities[id]).toMatchObject({ permission, effect, riskTier });
  });

  it.each(["notifications.read", "notifications.read_all"] as const)(
    "%s requires no idempotency key: marking read is idempotent by target state (spec 004 D6)",
    (id) => {
      expect(notificationsCapabilities[id].requiresIdempotencyKey).toBeUndefined();
    },
  );
});

describe("deriving notifications from the business day", () => {
  it("announces a confirmed booking that starts within the soon window", () => {
    expect(idsOf([booking({ id: "b1", startMin: 20 * 60 + 20 })])).toEqual(["booking.soon:b1"]);
  });

  it("stays quiet about a booking that starts later than the soon window", () => {
    expect(idsOf([booking({ id: "b1", startMin: 21 * 60 })])).toEqual([]);
  });

  it("flags a booking that has not arrived once the late threshold passes", () => {
    expect(idsOf([booking({ id: "b1", startMin: 19 * 60 + 45 })])).toEqual(["booking.late:b1"]);
  });

  it("does not flag a booking that was seated", () => {
    expect(idsOf([booking({ id: "b1", startMin: 19 * 60, status: "in_progress" })])).toEqual([]);
  });

  it("ignores bookings of another business day", () => {
    expect(idsOf([booking({ id: "b1", startMin: 19 * 60, businessDay: "2026-10-30" })])).toEqual([]);
  });

  it("yields a new-booking item for a booking created in the session, stamped with its creation moment", () => {
    const [item] = deriveNotifications(
      source([booking({ id: "b1", startMin: 23 * 60, createdAt: { day: "2026-10-31", minute: 1190 } })]),
      clock,
      rules,
    );
    expect([item?.id, item?.createdAt]).toEqual(["booking.new:b1", { day: "2026-10-31", minute: 1190 }]);
  });

  it("does not announce a walk-in that staff just seated", () => {
    expect(
      idsOf([
        booking({
          id: "b1",
          startMin: 20 * 60,
          origin: "walk_in",
          status: "in_progress",
          createdAt: { day: "2026-10-31", minute: 1200 },
        }),
      ]),
    ).toEqual([]);
  });

  it("yields a new-booking item for an online booking still awaiting its deposit", () => {
    expect(idsOf([booking({ id: "b1", startMin: 23 * 60, origin: "online", status: "awaiting_payment" })])).toEqual([
      "booking.new:b1",
    ]);
  });

  it("orders the feed newest first", () => {
    expect(
      idsOf([
        booking({ id: "late", startMin: 19 * 60 }),
        booking({ id: "soon", startMin: 20 * 60 + 25 }),
        booking({ id: "newer", startMin: 23 * 60, createdAt: { day: "2026-10-31", minute: 1195 } }),
      ]),
    ).toEqual(["booking.new:newer", "booking.soon:soon", "booking.late:late"]);
  });

  it("names the guest from the customer record when the booking has no contact name", () => {
    const [item] = deriveNotifications(
      source([booking({ id: "b1", startMin: 20 * 60 + 20, contactName: undefined, customerId: "c1" })]),
      clock,
      rules,
    );
    expect(item?.params).toMatchObject({ name: "Grace", time: "20:20", partySize: 2, minutes: 20 });
  });

  it("names the guest by the booking id when the customers module is not installed (ADR 0017 §3)", () => {
    const [item] = deriveNotifications(
      { bookings: [booking({ id: "b1", startMin: 20 * 60 + 20, contactName: undefined, customerId: "c1" })] },
      clock,
      rules,
    );
    expect(item?.params).toMatchObject({ name: "b1", time: "20:20" });
  });

  it("derives the same feed twice from the same inputs", () => {
    const bookings = [booking({ id: "b1", startMin: 20 * 60 + 20 }), booking({ id: "b2", startMin: 19 * 60 })];
    expect(idsOf(bookings)).toEqual(idsOf(bookings));
  });

  it.each([
    [0, "00:00"],
    [1245, "20:45"],
    [1440 + 30, "00:30"],
  ])("labels minute %s as %s", (minute, label) => {
    expect(timeLabel(minute)).toBe(label);
  });
});

describe("notifications messages", () => {
  it("passes the dictionary parity check in four languages", () => {
    expect(() => assertDictionaryParity(notificationsMessages)).not.toThrow();
  });

  it.each(LOCALES)("keeps the placeholders of every message equal to English in %s", (locale) => {
    const english = flattenMessages(notificationsMessages.en);
    const drifted = [...flattenMessages(notificationsMessages[locale])].filter(
      ([path, message]) => placeholderSignature(message) !== placeholderSignature(english.get(path) ?? ""),
    );
    expect(drifted.map(([path]) => path)).toEqual([]);
  });

  it("resolves every key a derived notification points at", () => {
    const [item] = deriveNotifications(
      source([booking({ id: "b1", startMin: 20 * 60 + 20, createdAt: { day: "2026-10-31", minute: 1190 } })]),
      clock,
      rules,
    );
    const keys = flattenMessages(notificationsMessages.en);
    expect([item?.titleKey, item?.bodyKey].map((key) => keys.has((key ?? "").replace("notifications.", "")))).toEqual([
      true,
      true,
    ]);
  });
});

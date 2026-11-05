import { describe, expect, it } from "vitest";

import { type Booking, bookingSchema } from "@/modules/bookings";

import {
  bookingStatusFor,
  businessDayFrom,
  customerIdsOf,
  daysBetween,
  type GuestRecord,
  guestRecordSchema,
  hourMarks,
  noLocalChanges,
  nowMinFor,
  patchLocal,
  percentInWindow,
  type Reservation,
  type ReservationContext,
  reservationChannel,
  reservationStatus,
  shiftDay,
  toReservation,
  toReservations,
  withLocalChanges,
  withStatus,
} from "./view-model";

const TODAY = "2026-10-31";

const context = (overrides: Partial<ReservationContext> = {}): ReservationContext => ({
  today: TODAY,
  customers: new Map(),
  resourceLabels: new Map(),
  ...overrides,
});

const withCustomers = (...customers: GuestRecord[]) =>
  context({ customers: new Map(customers.map((record) => [record.id, record])) });

const booking = (overrides: Record<string, unknown> = {}): Booking =>
  bookingSchema.parse({
    id: "R-1",
    status: "confirmed",
    businessDay: TODAY,
    startMin: 21 * 60,
    endMin: 22 * 60 + 30,
    resourceIds: ["S3"],
    staffIds: [],
    partySize: 4,
    lines: [],
    origin: "online",
    channel: "web",
    tags: [],
    ...overrides,
  });

const customer = (overrides: Partial<GuestRecord> = {}): GuestRecord => ({
  id: "C-1",
  name: "Ortega",
  phone: "+34600000102",
  email: "ortega@example.com",
  locale: "es",
  figures: {
    visits: 6,
    spend: { amountMinor: 31_200 },
    lastVisit: "2026-09-30T00:00:00Z",
  },
  ext: { allergens: ["gluten"], dietaryRestrictions: ["Gluten-free"] },
  ...overrides,
});

describe("reservationStatus", () => {
  it.each([
    ["pending", "pending"],
    ["awaiting_payment", "pending"],
    ["confirmed", "confirmed"],
    ["in_progress", "seated"],
    ["completed", "completed"],
    ["cancelled", "cancelled"],
    ["no_show", "no_show"],
  ] as const)("reads the module status %s as %s", (status, expected) => {
    expect(reservationStatus(status)).toBe(expected);
  });
});

describe("reservationChannel", () => {
  it("names a walk-in whatever medium it carries", () => {
    expect(reservationChannel({ origin: "walk_in", channel: "in_person" })).toBe("walk-in");
  });

  it("names the assistant before the medium", () => {
    expect(reservationChannel({ origin: "assistant", channel: "web" })).toBe("assistant");
  });

  it.each(["phone", "web", "whatsapp", "third_party"] as const)(
    "keeps the medium %s of a staff or online booking",
    (channel) => {
      expect(reservationChannel({ origin: "staff", channel })).toBe(channel);
    },
  );

  it("is unknown when the booking names no medium", () => {
    expect(reservationChannel({ origin: "online" })).toBe("unknown");
  });
});

describe("toReservation", () => {
  it("reads the module fields under the screen's names", () => {
    const reservation = toReservation(
      booking({ status: "in_progress", resourceIds: ["S3", "S4"], guestNote: "One guest is coeliac" }),
      context(),
    );

    expect(reservation).toMatchObject({
      id: "R-1",
      status: "seated",
      tableIds: ["S3", "S4"],
      partySize: 4,
      startMin: 21 * 60,
      endMin: 22 * 60 + 30,
      channel: "web",
      note: "One guest is coeliac",
    });
  });

  it("names the guest after the customer record before the contact name", () => {
    const named = toReservation(booking({ customerId: "C-1", contactName: "Someone else" }), withCustomers(customer()));

    expect(named.guest).toBe("Ortega");
  });

  it("names a one-off caller by the contact name", () => {
    expect(toReservation(booking({ contactName: "Rey" }), context()).guest).toBe("Rey");
  });

  it("leaves a walk-in without a name, for the screen to word in the active language", () => {
    expect(toReservation(booking({ origin: "walk_in" }), context()).guest).toBe("");
  });

  it("takes the contact details from the customer", () => {
    const reservation = toReservation(booking({ customerId: "C-1" }), withCustomers(customer()));

    expect([reservation.phone, reservation.email]).toEqual(["+34600000102", "ortega@example.com"]);
  });

  it("has no contact details and no profile for a guest without a record", () => {
    const reservation = toReservation(booking({ contactName: "Rey" }), context());

    expect([reservation.phone, reservation.email, reservation.profile]).toEqual([null, null, null]);
  });

  it("builds the profile from the customer's figures and allergens", () => {
    const reservation = toReservation(booking({ customerId: "C-1" }), withCustomers(customer()));

    expect(reservation.profile).toEqual({
      visits: 6,
      averageSpend: 52,
      lastVisitDaysAgo: 31,
      language: "es",
      allergens: ["gluten"],
    });
  });

  it("is a first visit when the customer has none on record", () => {
    const first = customer({ figures: { visits: 0, spend: null, lastVisit: null } });

    expect(toReservation(booking({ customerId: "C-1" }), withCustomers(first)).profile).toMatchObject({
      visits: 0,
      averageSpend: 0,
      lastVisitDaysAgo: null,
    });
  });

  it("counts a visit today as zero days ago", () => {
    const visited = customer({ figures: { visits: 1, spend: null, lastVisit: `${TODAY}T10:00:00Z` } });

    expect(toReservation(booking({ customerId: "C-1" }), withCustomers(visited)).profile?.lastVisitDaysAgo).toBe(0);
  });

  it("has no allergens when the customer's extension does not list any", () => {
    const plain = customer({ ext: undefined, locale: undefined });

    expect(toReservation(booking({ customerId: "C-1" }), withCustomers(plain)).profile).toMatchObject({
      allergens: [],
      language: null,
    });
  });

  it("keeps the staff note apart from the guest's", () => {
    const reservation = toReservation(booking({ staffNote: "Asked for the bill" }), context());

    expect([reservation.note, reservation.staffNote]).toEqual([null, "Asked for the bill"]);
  });

  it("calls each table by its resource label, or by its id when the resource is unknown", () => {
    const labelled = context({ resourceLabels: new Map([["S3", "Table 3"]]) });

    expect(toReservation(booking({ resourceIds: ["S3", "S9"] }), labelled).tableLabels).toEqual(["Table 3", "S9"]);
  });

  it("keeps the tags as written", () => {
    expect(toReservation(booking({ tags: ["Gluten-free", "Regular"] }), context()).tags).toEqual([
      "Gluten-free",
      "Regular",
    ]);
  });
});

describe("toReservations", () => {
  const bookings = [
    booking({ id: "late", startMin: 22 * 60, customerId: "C-1" }),
    booking({ id: "early", startMin: 19 * 60, contactName: "Rey" }),
  ];

  it("lists the earliest arrival first", () => {
    const ids = toReservations(bookings, context()).map((reservation) => reservation.id);

    expect(ids).toEqual(["early", "late"]);
  });

  it("matches each booking with the customer it names", () => {
    const [, withCustomer] = toReservations(bookings, withCustomers(customer()));

    expect(withCustomer?.guest).toBe("Ortega");
  });

  it("is empty for a day without bookings", () => {
    expect(toReservations([], context())).toEqual([]);
  });
});

describe("customerIdsOf", () => {
  it("lists each named customer once", () => {
    const ids = customerIdsOf([
      booking({ id: "a", customerId: "C-1" }),
      booking({ id: "b", customerId: "C-1" }),
      booking({ id: "c", contactName: "Rey" }),
      booking({ id: "d", customerId: "C-2" }),
    ]);

    expect(ids).toEqual(["C-1", "C-2"]);
  });
});

describe("days", () => {
  it.each([
    [TODAY, 1, "2026-11-01"],
    [TODAY, -1, "2026-10-30"],
    ["2026-12-31", 1, "2027-01-01"],
    ["2026-03-01", -1, "2026-02-28"],
  ])("shifts %s by %i to %s", (day, days, expected) => {
    expect(shiftDay(day, days)).toBe(expected);
  });

  it("counts the days between two dates", () => {
    expect(daysBetween("2026-10-17", TODAY)).toBe(14);
  });

  it("counts a later start as negative", () => {
    expect(daysBetween(TODAY, "2026-10-30")).toBe(-1);
  });

  it("takes the day from the URL when it is a real date", () => {
    expect(businessDayFrom("2026-11-02", TODAY)).toBe("2026-11-02");
  });

  it.each([undefined, "", "tomorrow", "2026-13-01", "2026-02-30", "2026-1-5"])(
    "falls back to the clock's day for %j",
    (param) => {
      expect(businessDayFrom(param, TODAY)).toBe(TODAY);
    },
  );
});

describe("nowMinFor", () => {
  const clock = { businessDay: TODAY, nowMin: 20 * 60 + 40 };

  it("is the clock's minute on today", () => {
    expect(nowMinFor(TODAY, clock)).toBe(20 * 60 + 40);
  });

  it("is the end of the day on a day that has passed", () => {
    expect(nowMinFor("2026-10-30", clock)).toBe(1440);
  });

  it("is the start of the day on a day to come", () => {
    expect(nowMinFor("2026-11-01", clock)).toBe(0);
  });
});

describe("withLocalChanges", () => {
  const base: Reservation[] = [
    toReservation(booking({ id: "a", contactName: "A" }), context()),
    toReservation(booking({ id: "b", contactName: "B" }), context()),
  ];

  it("returns the day's reservations untouched when nothing changed", () => {
    expect(withLocalChanges(base, noLocalChanges(TODAY), TODAY)).toEqual(base);
  });

  it("applies a patch to the reservation it names and no other", () => {
    const changes = { ...noLocalChanges(TODAY), patches: { a: { status: "seated" as const } } };

    expect(withLocalChanges(base, changes, TODAY).map((reservation) => reservation.status)).toEqual([
      "seated",
      "confirmed",
    ]);
  });

  it("patches on top of earlier patches of the same reservation", () => {
    const once = patchLocal(noLocalChanges(TODAY), TODAY, "a", { status: "seated" });
    const twice = patchLocal(once, TODAY, "a", { tableIds: ["S9"] });

    expect(twice.patches.a).toEqual({ status: "seated", tableIds: ["S9"] });
  });

  it("starts afresh when a change is made on another day than the last one", () => {
    const earlier = patchLocal(noLocalChanges("2026-11-01"), "2026-11-01", "a", { tableIds: ["S9"] });

    expect(patchLocal(earlier, TODAY, "b", { tableIds: ["S1"] })).toEqual({
      businessDay: TODAY,
      patches: { b: { tableIds: ["S1"] } },
    });
  });

  it("ignores changes made on another day", () => {
    const changes = { businessDay: "2026-11-01", patches: { a: { status: "seated" as const } } };

    expect(withLocalChanges(base, changes, TODAY)).toEqual(base);
  });
});

describe("withStatus", () => {
  const base: Reservation[] = [
    toReservation(booking({ id: "a", contactName: "A" }), context()),
    toReservation(booking({ id: "b", contactName: "B" }), context()),
  ];

  it("moves the reservation it names to the status and leaves the others", () => {
    expect(withStatus(base, { id: "a", status: "seated" }).map((reservation) => reservation.status)).toEqual([
      "seated",
      "confirmed",
    ]);
  });

  it("returns every reservation unchanged for an id that is not on the day", () => {
    expect(withStatus(base, { id: "ghost", status: "seated" })).toEqual(base);
  });
});

describe("bookingStatusFor", () => {
  it.each([
    ["pending", "pending"],
    ["confirmed", "confirmed"],
    ["seated", "in_progress"],
    ["completed", "completed"],
    ["cancelled", "cancelled"],
    ["no_show", "no_show"],
  ] as const)("names the %s reservation status %s in the module", (reservation, booking) => {
    expect(bookingStatusFor(reservation)).toBe(booking);
  });
});

describe("the agenda's axis", () => {
  const window = { startMin: 19 * 60, endMin: 24 * 60 };

  it("marks every hour from the window's start to its end", () => {
    expect(hourMarks(window)).toEqual([1140, 1200, 1260, 1320, 1380, 1440]);
  });

  it("stops at the last whole hour of a window that ends between marks", () => {
    expect(hourMarks({ startMin: 9 * 60, endMin: 11 * 60 + 30 })).toEqual([540, 600, 660]);
  });

  it("puts the window's start at 0% and its end at 100%", () => {
    expect([percentInWindow(window, window.startMin), percentInWindow(window, window.endMin)]).toEqual(["0%", "100%"]);
  });

  it("puts 9:30 PM in the middle of a 7 PM to midnight window at 50%", () => {
    expect(percentInWindow(window, 21 * 60 + 30)).toBe("50%");
  });
});

describe("guestRecordSchema", () => {
  it("keeps what the screen reads of a record and drops the rest", () => {
    const record = { ...customer(), notes: [{ text: "private" }], figures: { ...customer().figures, noShows: 2 } };

    expect(guestRecordSchema.parse(record)).toEqual(customer());
  });

  it("refuses a record without figures", () => {
    expect(guestRecordSchema.safeParse({ id: "C-1", name: "Ortega" }).success).toBe(false);
  });
});

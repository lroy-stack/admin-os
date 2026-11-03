import { describe, expect, it } from "vitest";

import { bookingsMessages } from "../messages.server";
import type { Reservation } from "../view-model";
import { canSeat, describeReading, formatDuration, readTable } from "./table-state";

const NOW = 20 * 60 + 40;
const text = bookingsMessages.en;

function booking(overrides: Partial<Reservation>): Reservation {
  return {
    id: "R-1",
    guest: "Guest",
    partySize: 2,
    startMin: NOW + 60,
    endMin: NOW + 150,
    status: "confirmed",
    tableIds: ["S1"],
    tableLabels: ["S1"],
    channel: "web",
    tags: [],
    note: null,
    staffNote: null,
    phone: null,
    email: null,
    profile: null,
    ...overrides,
  };
}

const table = { id: "S1", inService: true };

describe("readTable", () => {
  it("is free when nothing is due within 30 minutes, and says for how long", () => {
    const reading = readTable(table, [booking({ startMin: NOW + 110 })], NOW);
    expect(reading.state).toBe("free");
    expect(describeReading(reading, text, "en", NOW)).toBe("Free for 1 h 50 min");
  });

  it("is arriving when the next party is due within 30 minutes", () => {
    const reading = readTable(table, [booking({ startMin: NOW + 20 })], NOW);
    expect(reading.state).toBe("arriving");
    expect(describeReading(reading, text, "en", NOW)).toBe("Arrives 9:00 PM");
  });

  it("is seated, then leaving in the last 15 minutes", () => {
    expect(readTable(table, [booking({ status: "seated", startMin: NOW - 60, endMin: NOW + 40 })], NOW).state).toBe(
      "seated",
    );
    const leaving = readTable(table, [booking({ status: "seated", startMin: NOW - 80, endMin: NOW + 10 })], NOW);
    expect(leaving.state).toBe("leaving");
    expect(describeReading(leaving, text, "en", NOW)).toBe("Leaves in 10 min");
  });

  it("says how long a seated party has overstayed its slot", () => {
    const reading = readTable(table, [booking({ status: "seated", startMin: NOW - 100, endMin: NOW - 10 })], NOW);
    expect(reading.state).toBe("leaving");
    expect(describeReading(reading, text, "en", NOW)).toBe("Over by 10 min");
  });

  it("is late 10 minutes after a confirmed arrival time", () => {
    const reading = readTable(table, [booking({ startMin: NOW - 25 })], NOW);
    expect(reading.state).toBe("late");
    expect(describeReading(reading, text, "en", NOW)).toBe("Late 25 min");
    expect(readTable(table, [booking({ startMin: NOW - 9 })], NOW).state).not.toBe("late");
  });

  it("puts seated before late and blocked before everything", () => {
    const both = [booking({ id: "a", status: "seated", startMin: NOW - 30 }), booking({ id: "b", startMin: NOW - 20 })];
    expect(readTable(table, both, NOW).state).toBe("seated");
    expect(readTable({ id: "S1", inService: false }, both, NOW).state).toBe("blocked");
  });

  it("ignores cancelled, no-show and completed bookings", () => {
    const closed = (["cancelled", "no_show", "completed"] as const).map((status, index) =>
      booking({ id: `c${index}`, status, startMin: NOW - 5 }),
    );
    expect(readTable(table, closed, NOW).state).toBe("free");
  });
});

describe("canSeat", () => {
  const four = { id: "S1", inService: true, capacity: 4 };
  const party = booking({ id: "party", partySize: 4, startMin: NOW + 35, endMin: NOW + 125, tableIds: [] });

  it("refuses a table whose next booking overlaps the party, even while it reads free now", () => {
    const later = booking({ id: "later", startMin: NOW + 35 });
    expect(readTable(four, [later], NOW).state).toBe("free");
    expect(canSeat(four, party, [later], NOW)).toBe(false);
  });

  it("accepts a table whose bookings end before the party arrives", () => {
    const earlier = booking({ id: "earlier", startMin: NOW - 60, endMin: NOW + 30 });
    expect(canSeat(four, party, [earlier], NOW)).toBe(true);
  });

  it("keeps an overstaying seated party on its table until now", () => {
    const overstaying = booking({ id: "seated", status: "seated", startMin: NOW - 120, endMin: NOW - 10 });
    const walkUp = booking({ id: "party", startMin: NOW - 5, endMin: NOW + 85, tableIds: [] });
    expect(canSeat(four, walkUp, [overstaying], NOW)).toBe(false);
  });

  it("refuses tables that are too small or out of service", () => {
    expect(canSeat({ ...four, capacity: 2 }, party, [], NOW)).toBe(false);
    expect(canSeat({ ...four, inService: false }, party, [], NOW)).toBe(false);
  });
});

describe("formatDuration", () => {
  it("reads minutes, whole hours and hours with minutes", () => {
    expect(formatDuration(45, text.duration, "en")).toBe("45 min");
    expect(formatDuration(120, text.duration, "en")).toBe("2 h");
    expect(formatDuration(65, text.duration, "en")).toBe("1 h 5 min");
  });
});

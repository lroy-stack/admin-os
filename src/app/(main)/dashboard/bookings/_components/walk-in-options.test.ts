import { describe, expect, it } from "vitest";

import type { Reservation, ReservationStatus } from "./view-model";
import { selectedTableId, walkInOptions } from "./walk-in-options";

const NOW = 1240; // 8:40 PM
const STAY = 90;

const location = (id: string, capacity: number, inService = true) => ({
  table: { id, label: id, capacity, inService },
});

const reservation = (
  id: string,
  tableId: string,
  startMin: number,
  endMin: number,
  status: ReservationStatus = "confirmed",
): Reservation => ({
  id,
  guest: id,
  partySize: 2,
  startMin,
  endMin,
  status,
  tableIds: [tableId],
  tableLabels: [tableId],
  channel: "phone",
  tags: [],
  note: null,
  staffNote: null,
  phone: null,
  email: null,
  profile: null,
});

const options = (locations: ReturnType<typeof location>[], reservations: Reservation[], covers: number) =>
  walkInOptions({ locations, reservations, covers, nowMin: NOW, stayMin: STAY });

const ids = (result: ReturnType<typeof options>) =>
  result.kind === "fits" ? result.tables.map(({ table }) => table.id) : [];

describe("walkInOptions", () => {
  it("offers the free tables that seat the party, the closest fit first", () => {
    const result = options([location("B", 6), location("A", 2), location("C", 4)], [], 2);

    expect(ids(result)).toEqual(["A", "C", "B"]);
  });

  it("orders tables of the same size by label as people count", () => {
    const result = options([location("T10", 2), location("T9", 2)], [], 2);

    expect(ids(result)).toEqual(["T9", "T10"]);
  });

  it("leaves out a table too small for the party", () => {
    expect(ids(options([location("A", 2), location("B", 4)], [], 3))).toEqual(["B"]);
  });

  it("leaves out a table out of service", () => {
    expect(ids(options([location("A", 4, false), location("B", 4)], [], 2))).toEqual(["B"]);
  });

  it("leaves out a table with a seated party", () => {
    const seated = reservation("r1", "A", 1180, 1270, "seated");

    expect(ids(options([location("A", 4), location("B", 4)], [seated], 2))).toEqual(["B"]);
  });

  it("leaves out a table whose next booking starts inside the stay", () => {
    const soon = reservation("r1", "A", NOW + 60, NOW + 150);

    expect(ids(options([location("A", 4), location("B", 4)], [soon], 2))).toEqual(["B"]);
  });

  it("offers a table whose next booking starts exactly when the stay ends", () => {
    const later = reservation("r1", "A", NOW + STAY, NOW + STAY + 90);

    expect(ids(options([location("A", 4)], [later], 2))).toEqual(["A"]);
  });

  it("ignores a cancelled booking on a table", () => {
    const cancelled = reservation("r1", "A", NOW, NOW + 90, "cancelled");

    expect(ids(options([location("A", 4)], [cancelled], 2))).toEqual(["A"]);
  });

  it("offers a table whose seated party has passed its booked end, as the server does", () => {
    const overstaying = reservation("r1", "A", 1100, 1200, "seated");

    expect(ids(options([location("A", 4)], [overstaying], 2))).toEqual(["A"]);
  });

  it("names the table that frees up first when every fitting table is taken", () => {
    const early = reservation("r1", "A", 1180, NOW + 20, "seated");
    const late = reservation("r2", "B", 1180, NOW + 50, "seated");

    expect(options([location("B", 4), location("A", 4)], [late, early], 2)).toMatchObject({
      kind: "taken",
      next: { location: { table: { id: "A" } }, atMin: NOW + 20 },
    });
  });

  it("waits for the end of a chain of bookings that follow each other", () => {
    const first = reservation("r1", "A", 1180, NOW + 20, "seated");
    const second = reservation("r2", "A", NOW + 20, NOW + 100);

    expect(options([location("A", 4)], [first, second], 2)).toMatchObject({
      kind: "taken",
      next: { atMin: NOW + 100 },
    });
  });

  it("says no table frees up tonight when the last one is held to the end of the day", () => {
    const late = reservation("r1", "A", 1300, 1440);

    expect(options([location("A", 4)], [late], 2)).toEqual({ kind: "taken", next: null });
  });

  it("reports the largest table when none seats the party", () => {
    expect(options([location("A", 2), location("B", 4)], [], 6)).toEqual({ kind: "too_big", largest: 4 });
  });

  it("reports no seats at all when no table is in service", () => {
    expect(options([location("A", 4, false)], [], 2)).toEqual({ kind: "too_big", largest: 0 });
  });
});

describe("selectedTableId", () => {
  const fits = options([location("A", 2), location("B", 4)], [], 2);

  it("keeps the table the host chose while it still fits", () => {
    expect(selectedTableId(fits, "B")).toBe("B");
  });

  it("falls back to the closest fit when nothing was chosen", () => {
    expect(selectedTableId(fits, null)).toBe("A");
  });

  it("falls back to the closest fit when the chosen table no longer fits", () => {
    expect(selectedTableId(fits, "Z")).toBe("A");
  });

  it("selects nothing when no table fits", () => {
    expect(selectedTableId({ kind: "too_big", largest: 2 }, "A")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { serviceReservations } from "../reservations-data";
import { findTable, locateTables, totalSeats } from "./floor-model";
import { mockVenue } from "./venue";

describe("mock venue", () => {
  it("has a table for every table a reservation references", () => {
    const missing = serviceReservations
      .flatMap((reservation) => reservation.tableIds)
      .filter((tableId) => !findTable(mockVenue, tableId));
    expect(missing).toEqual([]);
  });

  it("keeps every table inside its zone", () => {
    const outside = locateTables(mockVenue)
      .filter(({ table, zone }) => {
        const { xCm, yCm, widthCm, depthCm } = zone.outline;
        return table.xCm <= xCm || table.xCm >= xCm + widthCm || table.yCm <= yCm || table.yCm >= yCm + depthCm;
      })
      .map(({ table }) => table.id);
    expect(outside).toEqual([]);
  });

  it("links the stairs both ways and counts seats in service", () => {
    const stairs = mockVenue.levels.flatMap((level) =>
      level.landmarks.filter((landmark) => landmark.kind === "stairs"),
    );
    expect(stairs.map((landmark) => landmark.toLevelId).sort()).toEqual(["rooftop", "street"]);
    expect(totalSeats(mockVenue)).toBeGreaterThan(40);
  });
});

import { describe, expect, it } from "vitest";

import { SERVICE_NOW_MIN, SERVICE_WINDOW, serviceReservations } from "../reservations-data";
import { loadOf, planRail, slotOf } from "./rail-plan";

const plan = planRail({
  reservations: serviceReservations,
  nowMin: SERVICE_NOW_MIN,
  windowStartMin: SERVICE_WINDOW.startMin,
  windowEndMin: SERVICE_WINDOW.endMin,
  totalSeats: 59,
});

describe("planRail", () => {
  it("snaps arrivals to 15-minute slots", () => {
    expect(slotOf(20 * 60 + 40, 19 * 60)).toBe(20 * 60 + 30);
    expect(slotOf(19 * 60, 19 * 60)).toBe(19 * 60);
  });

  it("folds past arrivals that need nothing, keeping late parties visible", () => {
    const foldedGuests = plan.folded?.rows.map((reservation) => reservation.guest) ?? [];
    expect(foldedGuests).toContain("Iglesias");
    expect(foldedGuests).not.toContain("Castaño");
    const visibleGuests = plan.slots.flatMap((slot) => slot.rows.map((reservation) => reservation.guest));
    expect(visibleGuests).toEqual(expect.arrayContaining(["Castaño", "Bravo"]));
  });

  it("marks the current slot and opens the next hour", () => {
    const nowSlot = plan.slots.find((slot) => slot.isNow);
    const nextHour = plan.slots.filter(
      (slot) => slot.startMin > (nowSlot?.startMin ?? 0) && slot.startMin < SERVICE_NOW_MIN + 60,
    );
    expect(nowSlot?.startMin).toBe(20 * 60 + 30);
    expect(nextHour.map((slot) => slot.open)).not.toContain(false);
  });

  it("keeps load and free seats from every booking while the rows follow a filter", () => {
    const searched = planRail({
      reservations: serviceReservations.filter((reservation) => reservation.guest === "Bravo"),
      seatHolders: serviceReservations,
      nowMin: SERVICE_NOW_MIN,
      windowStartMin: SERVICE_WINDOW.startMin,
      windowEndMin: SERVICE_WINDOW.endMin,
      totalSeats: 59,
    });
    const searchedNow = searched.slots.find((slot) => slot.isNow);
    expect(searchedNow?.rows.map((reservation) => reservation.guest)).toEqual(["Bravo"]);
    expect(searchedNow?.freeSeats).toBe(plan.slots.find((slot) => slot.isNow)?.freeSeats);
  });

  it("never lists cancelled or no-show bookings", () => {
    const guests = plan.slots.flatMap((slot) => slot.rows.map((reservation) => reservation.guest));
    expect(guests).not.toContain("Vidal");
    expect(guests).not.toContain("Herrera");
  });
});

describe("loadOf", () => {
  it("reads calm, busy and full from occupancy", () => {
    expect(loadOf(0.2)).toBe("calm");
    expect(loadOf(0.5)).toBe("busy");
    expect(loadOf(0.8)).toBe("full");
  });
});

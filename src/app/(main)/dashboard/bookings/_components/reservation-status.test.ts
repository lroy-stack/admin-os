import { describe, expect, it } from "vitest";

import { isCancellable, isNoShowable } from "./reservation-status";
import type { Reservation, ReservationStatus } from "./view-model";

const reservation = (status: ReservationStatus, startMin = 1200): Reservation => ({
  id: "r",
  guest: "Ortega",
  partySize: 2,
  startMin,
  endMin: startMin + 90,
  status,
  tableIds: [],
  tableLabels: [],
  channel: "phone",
  tags: [],
  note: null,
  staffNote: null,
  phone: null,
  email: null,
  profile: null,
});

describe("isCancellable", () => {
  it.each(["pending", "confirmed"] as const)("offers cancelling a %s reservation", (status) => {
    expect(isCancellable(reservation(status))).toBe(true);
  });

  it.each(["seated", "completed", "cancelled", "no_show"] as const)("does not offer cancelling a %s one", (status) => {
    expect(isCancellable(reservation(status))).toBe(false);
  });
});

describe("isNoShowable", () => {
  it("offers a no-show for a confirmed party that is late", () => {
    expect(isNoShowable(reservation("confirmed", 1200), 1210, 10)).toBe(true);
  });

  it("does not offer a no-show one minute before the party counts as late", () => {
    expect(isNoShowable(reservation("confirmed", 1200), 1209, 10)).toBe(false);
  });

  it.each(["pending", "seated", "completed", "cancelled", "no_show"] as const)(
    "does not offer a no-show for a %s reservation",
    (status) => {
      expect(isNoShowable(reservation(status, 1200), 1400, 10)).toBe(false);
    },
  );
});

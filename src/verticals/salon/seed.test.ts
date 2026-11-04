import { describe, expect, it } from "vitest";

import { bookingSchema } from "@/modules/bookings";

import { salonSeed } from "./seed";

describe("salon seed", () => {
  it.each(salonSeed.bookings.map((booking) => [booking.id, booking] as const))(
    "makes appointment %s as long as the sum of its service durations",
    (_id, booking) => {
      const total = booking.lines.reduce((sum, line) => sum + (line.durationMin ?? 0) * line.qty, 0);
      expect(booking.endMin - booking.startMin).toBe(total);
    },
  );

  it.each(salonSeed.bookings.map((booking) => [booking.id, booking] as const))(
    "gives appointment %s a stylist and a chair",
    (_id, booking) => {
      expect([booking.staffIds.length, booking.resourceIds.length]).toEqual([1, 1]);
    },
  );

  it.each(salonSeed.bookings.map((booking) => [booking.id, booking] as const))(
    "parses appointment %s without a partySize and defaults it to 1",
    (_id, booking) => {
      expect(bookingSchema.parse(booking).partySize).toBe(1);
    },
  );

  it("names a one-off phone caller without a customer record", () => {
    const callers = salonSeed.bookings.filter((booking) => booking.channel === "phone" && !booking.customerId);
    expect(callers.map((booking) => booking.contactName)).toEqual(["Elena"]);
  });

  it("includes an appointment awaiting a deposit", () => {
    expect(
      salonSeed.bookings.filter(
        (booking) => booking.status === "awaiting_payment" && booking.deposit?.status === "due",
      ),
    ).toHaveLength(1);
  });

  it("gives each service a required skill and each retail product none", () => {
    expect(salonSeed.catalog.map((item) => [item.kind, Object.hasOwn(item.ext ?? {}, "requiredSkill")])).toEqual([
      ["service", true],
      ["service", true],
      ["service", true],
      ["product", false],
      ["product", false],
      ["product", false],
    ]);
  });

  it("books the walk-in without recording a channel", () => {
    expect(
      salonSeed.bookings.filter((booking) => booking.origin === "walk_in").map((booking) => booking.channel),
    ).toEqual([undefined]);
  });

  it("gives one stylist a contract", () => {
    expect(salonSeed.staff.filter((member) => member.contract)).toHaveLength(1);
  });

  it("has two stylists with skills", () => {
    expect(salonSeed.staff.map((member) => member.skills.length > 0)).toEqual([true, true]);
  });

  it("has two clients", () => {
    expect(salonSeed.customers).toHaveLength(2);
  });
});

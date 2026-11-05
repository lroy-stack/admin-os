import { describe, expect, it } from "vitest";

import { bookingSchema } from "@/modules/bookings";
import { purchaseOrderSchema, stockItemSchema } from "@/modules/inventory";
import { partySchema } from "@/modules/parties";

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

describe("salon parties seed", () => {
  it("parses with the module schema", () => {
    expect(salonSeed.parties.map((party) => partySchema.safeParse(party).success)).toEqual(
      salonSeed.parties.map(() => true),
    );
  });

  it("has unique ids", () => {
    expect(new Set(salonSeed.parties.map((party) => party.id)).size).toBe(salonSeed.parties.length);
  });

  it("uses only fictitious addresses ending in .example", () => {
    expect(salonSeed.parties.filter((party) => !party.email.endsWith(".example"))).toEqual([]);
  });
});

describe("salon inventory seed", () => {
  it("parses stock items and orders with the module schemas", () => {
    expect([
      salonSeed.stockItems.map((item) => stockItemSchema.safeParse(item).success),
      salonSeed.purchaseOrders.map((order) => purchaseOrderSchema.safeParse(order).success),
    ]).toEqual([salonSeed.stockItems.map(() => true), salonSeed.purchaseOrders.map(() => true)]);
  });

  it("has unique ids", () => {
    expect([
      new Set(salonSeed.stockItems.map((item) => item.id)).size,
      new Set(salonSeed.purchaseOrders.map((order) => order.id)).size,
    ]).toEqual([salonSeed.stockItems.length, salonSeed.purchaseOrders.length]);
  });

  it("points every reference at a row that exists", () => {
    const parties = salonSeed.parties.map((party) => party.id);
    const catalogIds = salonSeed.catalog.map((item) => item.id);
    const stockIds = salonSeed.stockItems.map((item) => item.id);
    expect([
      salonSeed.stockItems.filter((item) => !parties.includes(item.supplierId ?? "")),
      salonSeed.stockItems.filter(
        (item) => item.catalogItemId !== undefined && !catalogIds.includes(item.catalogItemId),
      ),
      salonSeed.purchaseOrders.filter((order) => !parties.includes(order.supplierId ?? "")),
      salonSeed.purchaseOrders.filter((order) => order.lines.some((line) => !stockIds.includes(line.stockItemId))),
    ]).toEqual([[], [], [], []]);
  });

  it("keeps at least one item below its reorder point", () => {
    expect(salonSeed.stockItems.filter((item) => item.onHand <= item.reorderPoint).length).toBeGreaterThan(0);
  });
});

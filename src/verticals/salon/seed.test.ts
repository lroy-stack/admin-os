import { describe, expect, it } from "vitest";
import { z } from "zod";

import { bookingSchema } from "@/modules/bookings";
import { catalogItemSchema } from "@/modules/catalog";
import { customerSchema } from "@/modules/customers";
import { areaSchema, resourceSchema } from "@/modules/resources";
import { shiftSchema, staffMemberSchema } from "@/modules/staff";

import { catalogItemExtSchema, customerExtSchema, staffExtSchema } from "./extensions";
import { salonSeed } from "./seed";

const moduleCollections: [string, z.ZodType, unknown][] = [
  ["areas", z.array(areaSchema), salonSeed.areas],
  ["resources", z.array(resourceSchema), salonSeed.resources],
  ["customers", z.array(customerSchema), salonSeed.customers],
  ["catalog", z.array(catalogItemSchema), salonSeed.catalog],
  ["staff", z.array(staffMemberSchema), salonSeed.staff],
  ["shifts", z.array(shiftSchema), salonSeed.shifts],
  ["bookings", z.array(bookingSchema), salonSeed.bookings],
];

const extCollections: [string, z.ZodType, unknown][] = [
  ["customer", z.array(customerExtSchema), salonSeed.customers.map((entity) => entity.ext)],
  ["catalog item", z.array(catalogItemExtSchema), salonSeed.catalog.map((entity) => entity.ext)],
  ["staff member", z.array(staffExtSchema), salonSeed.staff.map((entity) => entity.ext)],
];

describe("salon seed", () => {
  it.each(moduleCollections)("parses the %s collection with the module schema", (_name, schema, data) => {
    expect(schema.safeParse(data).error).toBeUndefined();
  });

  it.each(extCollections)("parses the %s ext slots with the preset schema", (_name, schema, data) => {
    expect(schema.safeParse(data).error).toBeUndefined();
  });

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

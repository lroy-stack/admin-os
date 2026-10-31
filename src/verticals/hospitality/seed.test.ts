import { describe, expect, it } from "vitest";
import { z } from "zod";

import { bookingSchema } from "@/modules/bookings";
import { catalogItemSchema } from "@/modules/catalog";
import { customerSchema } from "@/modules/customers";
import { areaSchema, resourceSchema } from "@/modules/resources";
import { shiftSchema, staffMemberSchema } from "@/modules/staff";

import {
  areaExtSchema,
  bookingExtSchema,
  catalogItemExtSchema,
  customerExtSchema,
  resourceExtSchema,
  staffExtSchema,
} from "./extensions";
import { hospitalitySeed } from "./seed";

const NOW_MIN = 20 * 60 + 40;
const LATE_AFTER_MIN = 10;

const moduleCollections: [string, z.ZodType, unknown][] = [
  ["areas", z.array(areaSchema), hospitalitySeed.areas],
  ["resources", z.array(resourceSchema), hospitalitySeed.resources],
  ["customers", z.array(customerSchema), hospitalitySeed.customers],
  ["catalog", z.array(catalogItemSchema), hospitalitySeed.catalog],
  ["staff", z.array(staffMemberSchema), hospitalitySeed.staff],
  ["shifts", z.array(shiftSchema), hospitalitySeed.shifts],
  ["bookings", z.array(bookingSchema), hospitalitySeed.bookings],
];

const extCollections: [string, z.ZodType, unknown][] = [
  ["area", z.array(areaExtSchema), hospitalitySeed.areas.map((entity) => entity.ext)],
  ["resource", z.array(resourceExtSchema), hospitalitySeed.resources.map((entity) => entity.ext)],
  ["customer", z.array(customerExtSchema), hospitalitySeed.customers.map((entity) => entity.ext)],
  ["catalog item", z.array(catalogItemExtSchema), hospitalitySeed.catalog.map((entity) => entity.ext)],
  ["staff member", z.array(staffExtSchema), hospitalitySeed.staff.map((entity) => entity.ext)],
  ["booking", z.array(bookingExtSchema.optional()), hospitalitySeed.bookings.map((entity) => entity.ext)],
];

const { bookings, resources, catalog, customers } = hospitalitySeed;

describe("hospitality seed", () => {
  it.each(moduleCollections)("parses the %s collection with the module schema", (_name, schema, data) => {
    expect(schema.safeParse(data).error).toBeUndefined();
  });

  it.each(extCollections)("parses the %s ext slots with the preset schema", (_name, schema, data) => {
    expect(schema.safeParse(data).error).toBeUndefined();
  });

  it("references only existing resources from bookings", () => {
    const known = new Set(resources.map((resource) => resource.id));
    const unknown = bookings.flatMap((booking) => booking.resourceIds).filter((id) => !known.has(id));
    expect(unknown).toEqual([]);
  });

  it("references only existing catalog items from booking lines and bundle sections", () => {
    const known = new Set(catalog.map((item) => item.id));
    const fromLines = bookings.flatMap((booking) => booking.lines.map((line) => line.catalogItemId));
    const fromSections = catalog.flatMap((item) => item.sections?.flatMap((section) => section.itemIds) ?? []);
    expect([...fromLines, ...fromSections].filter((id) => !known.has(id))).toEqual([]);
  });

  it("references only existing customers from bookings", () => {
    const known = new Set(customers.map((customer) => customer.id));
    const unknown = bookings
      .flatMap((booking) => (booking.customerId ? [booking.customerId] : []))
      .filter((id) => !known.has(id));
    expect(unknown).toEqual([]);
  });

  it("places tables in areas across two levels", () => {
    expect(new Set(hospitalitySeed.areas.map((area) => area.levelId)).size).toBe(2);
  });

  it("includes a seated booking", () => {
    expect(bookings.filter((booking) => booking.status === "in_progress")).not.toHaveLength(0);
  });

  it("includes a late booking", () => {
    const late = bookings.filter(
      (booking) => booking.status === "confirmed" && booking.startMin + LATE_AFTER_MIN < NOW_MIN,
    );
    expect(late).not.toHaveLength(0);
  });

  it("includes an unassigned booking", () => {
    expect(
      bookings.filter((booking) => booking.resourceIds.length === 0 && booking.status === "confirmed"),
    ).not.toHaveLength(0);
  });

  it("includes a walk-in booking", () => {
    expect(bookings.filter((booking) => booking.origin === "walk_in")).not.toHaveLength(0);
  });

  it("names a one-off phone caller without a customer record", () => {
    const callers = bookings.filter((booking) => booking.channel === "phone" && !booking.customerId);
    expect(callers.map((booking) => booking.contactName)).toEqual(["Rey", "Herrera"]);
  });

  it("includes a booking awaiting a deposit", () => {
    expect(
      bookings.filter((booking) => booking.status === "awaiting_payment" && booking.deposit?.status === "due"),
    ).toHaveLength(1);
  });

  it("includes a booking with a captured deposit", () => {
    expect(bookings.filter((booking) => booking.deposit?.status === "captured")).toHaveLength(1);
  });

  it("gives one staff member a contract", () => {
    expect(hospitalitySeed.staff.filter((member) => member.contract)).toHaveLength(1);
  });

  it("includes a large group", () => {
    expect(bookings.filter((booking) => (booking.partySize ?? 1) >= 8)).not.toHaveLength(0);
  });

  it("includes a cancelled booking", () => {
    expect(bookings.filter((booking) => booking.status === "cancelled")).not.toHaveLength(0);
  });

  it("includes a customer with allergies in ext", () => {
    const withAllergies = customers.filter((customer) => customerExtSchema.parse(customer.ext).allergens.length > 0);
    expect(withAllergies).not.toHaveLength(0);
  });

  it("includes a tasting menu bundle with course sections", () => {
    const bundle = catalog.find((item) => item.kind === "bundle");
    expect(bundle?.sections).toHaveLength(3);
  });

  it("includes a dish of the day", () => {
    expect(catalog.filter((item) => catalogItemExtSchema.parse(item.ext).dishOfTheDay)).toHaveLength(1);
  });
});

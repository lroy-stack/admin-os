import { describe, expect, it } from "vitest";
import { z } from "zod";

import { bookingSchema } from "@/modules/bookings";
import { catalogItemSchema } from "@/modules/catalog";
import { assetSchema, customerSchema } from "@/modules/customers";
import { areaSchema, resourceSchema } from "@/modules/resources";
import { staffMemberSchema } from "@/modules/staff";

import { assetExtSchema, bookingExtSchema, catalogItemExtSchema, staffExtSchema } from "./extensions";
import { workshopSeed } from "./seed";

const moduleCollections: [string, z.ZodType, unknown][] = [
  ["areas", z.array(areaSchema), workshopSeed.areas],
  ["resources", z.array(resourceSchema), workshopSeed.resources],
  ["customers", z.array(customerSchema), workshopSeed.customers],
  ["assets", z.array(assetSchema), workshopSeed.assets],
  ["catalog", z.array(catalogItemSchema), workshopSeed.catalog],
  ["staff", z.array(staffMemberSchema), workshopSeed.staff],
  ["bookings", z.array(bookingSchema), workshopSeed.bookings],
];

const extCollections: [string, z.ZodType, unknown][] = [
  ["booking", z.array(bookingExtSchema), workshopSeed.bookings.map((entity) => entity.ext)],
  ["asset", z.array(assetExtSchema), workshopSeed.assets.map((entity) => entity.ext)],
  ["catalog item", z.array(catalogItemExtSchema), workshopSeed.catalog.map((entity) => entity.ext)],
  ["staff member", z.array(staffExtSchema), workshopSeed.staff.map((entity) => entity.ext)],
];

describe("workshop seed", () => {
  it.each(moduleCollections)("parses the %s collection with the module schema", (_name, schema, data) => {
    expect(schema.safeParse(data).error).toBeUndefined();
  });

  it.each(extCollections)("parses the %s ext slots with the preset schema", (_name, schema, data) => {
    expect(schema.safeParse(data).error).toBeUndefined();
  });

  it("parses the drop-off without a partySize and defaults it to 1", () => {
    expect(bookingSchema.parse(workshopSeed.bookings[0]).partySize).toBe(1);
  });

  it("books the drop-off on a bay", () => {
    expect(
      workshopSeed.resources.filter((resource) => workshopSeed.bookings[0]?.resourceIds.includes(resource.id)),
    ).toEqual([expect.objectContaining({ kind: "bay" })]);
  });

  it("points the drop-off at a vehicle asset of its customer", () => {
    const booking = workshopSeed.bookings[0];
    const asset = workshopSeed.assets.find(
      (candidate) => candidate.id === bookingExtSchema.parse(booking?.ext).assetId,
    );
    expect(asset?.customerId).toBe(booking?.customerId);
  });

  it("gives the mechanic a contract", () => {
    expect(workshopSeed.staff[0]?.contract?.type).toBe("employee");
  });

  it("has parts and labour as catalog items", () => {
    expect(workshopSeed.catalog.map((item) => item.kind)).toEqual(["product", "service"]);
  });
});

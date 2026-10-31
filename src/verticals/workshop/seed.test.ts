import { describe, expect, it } from "vitest";

import { bookingSchema } from "@/modules/bookings";

import { bookingExtSchema } from "./extensions";
import { workshopSeed } from "./seed";

describe("workshop seed", () => {
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

  it.each(workshopSeed.bookings.map((booking) => [booking.id, booking] as const))(
    "records the vehicle of drop-off %s in ext.assetId",
    (_id, booking) => {
      expect(bookingExtSchema.safeParse(booking.ext).error).toBeUndefined();
    },
  );

  it("gives the mechanic a contract", () => {
    expect(workshopSeed.staff[0]?.contract?.type).toBe("employee");
  });

  it("has parts and labour as catalog items", () => {
    expect(workshopSeed.catalog.map((item) => item.kind)).toEqual(["product", "service"]);
  });
});

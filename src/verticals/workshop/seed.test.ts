import { describe, expect, it } from "vitest";

import { bookingSchema } from "@/modules/bookings";
import { purchaseOrderSchema, stockItemSchema } from "@/modules/inventory";
import { partySchema } from "@/modules/parties";

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
    expect(workshopSeed.catalog.map((item) => item.kind)).toEqual([
      "product",
      "service",
      "product",
      "product",
      "product",
    ]);
  });
});

describe("workshop parties seed", () => {
  it("parses with the module schema", () => {
    expect(workshopSeed.parties.map((party) => partySchema.safeParse(party).success)).toEqual(
      workshopSeed.parties.map(() => true),
    );
  });

  it("has unique ids", () => {
    expect(new Set(workshopSeed.parties.map((party) => party.id)).size).toBe(workshopSeed.parties.length);
  });

  it("uses only fictitious addresses ending in .example", () => {
    expect(workshopSeed.parties.filter((party) => !party.email.endsWith(".example"))).toEqual([]);
  });

  it("names the suppliers its parts were bought from", () => {
    const suppliers = workshopSeed.parties.filter((party) => party.roles.includes("supplier"));
    expect(suppliers.map((party) => party.legalName)).toEqual(["Distribuciones Levante", "Recambios Norte"]);
  });
});

describe("workshop inventory seed", () => {
  it("parses stock items and orders with the module schemas", () => {
    expect([
      workshopSeed.stockItems.map((item) => stockItemSchema.safeParse(item).success),
      workshopSeed.purchaseOrders.map((order) => purchaseOrderSchema.safeParse(order).success),
    ]).toEqual([workshopSeed.stockItems.map(() => true), workshopSeed.purchaseOrders.map(() => true)]);
  });

  it("has unique ids", () => {
    expect([
      new Set(workshopSeed.stockItems.map((item) => item.id)).size,
      new Set(workshopSeed.purchaseOrders.map((order) => order.id)).size,
    ]).toEqual([workshopSeed.stockItems.length, workshopSeed.purchaseOrders.length]);
  });

  it("points every reference at a row that exists", () => {
    const parties = workshopSeed.parties.map((party) => party.id);
    const catalogIds = workshopSeed.catalog.map((item) => item.id);
    const stockIds = workshopSeed.stockItems.map((item) => item.id);
    expect([
      workshopSeed.stockItems.filter((item) => !parties.includes(item.supplierId ?? "")),
      workshopSeed.stockItems.filter(
        (item) => item.catalogItemId !== undefined && !catalogIds.includes(item.catalogItemId),
      ),
      workshopSeed.purchaseOrders.filter((order) => !parties.includes(order.supplierId ?? "")),
      workshopSeed.purchaseOrders.filter((order) => order.lines.some((line) => !stockIds.includes(line.stockItemId))),
    ]).toEqual([[], [], [], []]);
  });

  it("keeps at least one item below its reorder point", () => {
    expect(workshopSeed.stockItems.filter((item) => item.onHand <= item.reorderPoint).length).toBeGreaterThan(0);
  });
});

describe("workshop stock migrated from the parts' ext (ADR 0018 §1)", () => {
  it.each([
    ["part-brake-pads", "BP-F-118", 6, "Distribuciones Levante"],
    ["part-oil-filter", "OF-204", 14, "Distribuciones Levante"],
    ["part-air-filter", "AF-311", 9, "Recambios Norte"],
    ["part-wiper-blades", "WB-450", 4, "Recambios Norte"],
  ])("keeps %s as a stock row with its former sku, stock and supplier", (partId, sku, onHand, supplier) => {
    const row = workshopSeed.stockItems.find((item) => item.catalogItemId === partId);
    const party = workshopSeed.parties.find((candidate) => candidate.id === row?.supplierId);
    expect([row?.sku, row?.onHand, party?.legalName]).toEqual([sku, onHand, supplier]);
  });

  it("leaves no stock fields on the parts", () => {
    expect(workshopSeed.catalog.filter((item) => item.categoryId === "parts" && item.ext !== undefined)).toEqual([]);
  });
});

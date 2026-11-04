import { describe, expect, it } from "vitest";

import { logisticsMessages } from "./messages.server";
import { filterShipments, noShipmentFilter, tabOf } from "./shipment-filter";
import { localizeShipments } from "./shipment-localize";

const shipments = localizeShipments("en", logisticsMessages.en);

describe("tabOf", () => {
  it("counts a shipment out for delivery as in transit", () => {
    expect(tabOf("outForDelivery")).toBe("inTransit");
  });

  it("counts a customs hold as a delay", () => {
    expect(tabOf("customsHold")).toBe("delayed");
  });

  it("leaves a scheduled shipment out of every status tab", () => {
    expect(tabOf("scheduled")).toBeNull();
  });
});

describe("filterShipments", () => {
  it("keeps every shipment without a filter", () => {
    expect(filterShipments(shipments, noShipmentFilter)).toHaveLength(shipments.length);
  });

  it("narrows to a tab", () => {
    const result = filterShipments(shipments, { ...noShipmentFilter, tab: "delivered" });
    expect(result.map((shipment) => tabOf(shipment.status))).toEqual(result.map(() => "delivered"));
  });

  it("narrows to a transport mode", () => {
    const result = filterShipments(shipments, { ...noShipmentFilter, mode: "air" });
    expect(result.map((shipment) => shipment.mode)).toEqual(result.map(() => "air"));
  });

  it("finds a shipment by part of its id, ignoring case", () => {
    const [first] = shipments;
    const result = filterShipments(shipments, { ...noShipmentFilter, query: ` ${first?.id.toLowerCase()} ` });
    expect(result.map((shipment) => shipment.id)).toContain(first?.id);
  });

  it("returns nothing for text no shipment holds", () => {
    expect(filterShipments(shipments, { ...noShipmentFilter, query: "zzzz-no-match" })).toEqual([]);
  });
});

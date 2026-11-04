import type { ShipmentStatus, TransportMode } from "./shipment-data";
import type { Shipment } from "./shipment-localize";

export const shipmentTabs = ["all", "inTransit", "delivered", "delayed"] as const;
export type ShipmentTab = (typeof shipmentTabs)[number];

export const modeFilters = ["all", "air", "land", "sea"] as const;
export type ModeFilter = (typeof modeFilters)[number];

export interface ShipmentFilter {
  readonly tab: ShipmentTab;
  readonly query: string;
  readonly mode: ModeFilter;
}

export const noShipmentFilter: ShipmentFilter = { tab: "all", query: "", mode: "all" };

/** The tab a status counts under: a shipment out for delivery is still in transit; a hold is a delay. */
export function tabOf(status: ShipmentStatus): Exclude<ShipmentTab, "all"> | null {
  switch (status) {
    case "inTransit":
    case "outForDelivery":
      return "inTransit";
    case "delivered":
      return "delivered";
    case "delayed":
    case "onHold":
    case "customsHold":
      return "delayed";
    case "scheduled":
      return null;
  }
}

const isMode = (mode: ModeFilter): mode is TransportMode => mode !== "all";

/** The shipments that fit the tab, the transport mode and the search (an id, customer, cargo or place). */
export function filterShipments(shipments: readonly Shipment[], filter: ShipmentFilter): Shipment[] {
  const needle = filter.query.trim().toLowerCase();
  return shipments.filter((shipment) => {
    if (filter.tab !== "all" && tabOf(shipment.status) !== filter.tab) return false;
    if (isMode(filter.mode) && shipment.mode !== filter.mode) return false;
    if (needle === "") return true;
    return [
      shipment.id,
      shipment.customer.name,
      shipment.cargo,
      shipment.origin.display,
      shipment.origin.country,
      shipment.destination.display,
      shipment.destination.country,
    ].some((text) => text.toLowerCase().includes(needle));
  });
}

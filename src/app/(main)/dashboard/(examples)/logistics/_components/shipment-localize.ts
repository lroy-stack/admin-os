import { format, formatDate, formatNumber, formatPercent, type Locale, weekdayNames } from "@/core/i18n";

import type { LogisticsMessages } from "./messages";
import {
  type CustomerTier,
  type EtaPart,
  type GeoCoordinate,
  type HandlingTagId,
  type PlaceSource,
  type RouteType,
  type ShipmentSource,
  type ShipmentStatus,
  shipmentSources,
  type TransportMode,
} from "./shipment-data";

export type ShipmentPlace = {
  /** "Aeropuerto CGK", "Hafen Tanjung Priok": the place named for the locale. */
  display: string;
  /** The country named for the locale. */
  country: string;
  countryCode: string;
  coordinates: GeoCoordinate;
};

/** A shipment with every visible string already written for one locale; the client component only renders it. */
export type Shipment = {
  id: string;
  customer: { name: string; initials: string; id: string; tier: CustomerTier; tierName: string; tierNote: string };
  origin: ShipmentPlace;
  destination: ShipmentPlace;
  cargo: string;
  handling: { label: string; note: string; tags: { id: HandlingTagId; label: string }[] };
  weight: string;
  eta: string;
  etaMeta: string;
  status: ShipmentStatus;
  statusLabel: string;
  progress: number;
  /** "65% complete" */
  complete: string;
  mode: TransportMode;
  modeLabel: string;
  routeTypeLabel: string;
  routeType: RouteType;
  transportNumber: string;
};

const regionNames = new Map<Locale, Intl.DisplayNames>();

function regionName(countryCode: string, locale: Locale): string {
  let names = regionNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames(locale, { type: "region", style: "short" });
    regionNames.set(locale, names);
  }
  return names.of(countryCode) ?? countryCode;
}

/** A wall-clock time such as "14:50" in the locale's clock ("2:50 PM", "14:50"). */
function clockTime(time: string, locale: Locale): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return formatDate(Date.UTC(1970, 0, 1, hours, minutes), locale, "UTC", { hour: "numeric", minute: "2-digit" });
}

function etaPart(part: EtaPart, locale: Locale, text: LogisticsMessages): string {
  switch (part.kind) {
    case "time":
      return clockTime(part.time, locale);
    case "weekday":
      return weekdayNames(locale)[part.weekday] ?? "";
    case "note":
      return text.etaNotes[part.note];
  }
}

function place(source: PlaceSource, locale: Locale, text: LogisticsMessages): ShipmentPlace {
  const display =
    source.kind === "city" ? source.name : format(text.places[source.kind], locale, { name: source.name });
  return {
    display,
    country: regionName(source.countryCode, locale),
    countryCode: source.countryCode,
    coordinates: source.coordinates,
  };
}

function localizeShipment(source: ShipmentSource, locale: Locale, text: LogisticsMessages): Shipment {
  const demo = text.shipments[source.id as keyof LogisticsMessages["shipments"]];
  const { customer } = source;
  return {
    id: source.id,
    customer: {
      name: customer.name,
      initials: customer.initials,
      id: customer.id,
      tier: customer.tier,
      tierName: text.tiers[customer.tier],
      tierNote: format(text.tierNotes[customer.tierNote], locale, { share: formatPercent(0.01, locale) }),
    },
    origin: place(source.origin, locale, text),
    destination: place(source.destination, locale, text),
    cargo: demo.cargo,
    handling: {
      label: text.handlingLabels[source.handling.label],
      note: format(demo.note, locale, {
        temperature: formatNumber(-18, locale, { style: "unit", unit: "celsius" }),
      }),
      tags: source.handling.tags.map((id) => ({ id, label: text.handlingTags[id] })),
    },
    weight: formatNumber(source.weightKg, locale, { style: "unit", unit: "kilogram" }),
    eta: etaPart(source.eta, locale, text),
    etaMeta: etaPart(source.etaMeta, locale, text),
    status: source.status,
    statusLabel: text.statuses[source.status],
    progress: source.progress,
    complete: format(text.details.complete, locale, { progress: formatPercent(source.progress / 100, locale) }),
    mode: source.mode,
    modeLabel: text.modes[source.mode],
    routeType: source.routeType,
    routeTypeLabel: text.routeTypes[source.routeType],
    transportNumber: source.transportNumber,
  };
}

/** The demo shipments written for one locale (spec D5: business text is localized, proper nouns are not). */
export function localizeShipments(locale: Locale, text: LogisticsMessages): Shipment[] {
  return shipmentSources.map((source) => localizeShipment(source, locale, text));
}

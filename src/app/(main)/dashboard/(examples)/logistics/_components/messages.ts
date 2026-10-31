import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

import type {
  CustomerTier,
  EtaNote,
  HandlingLabelId,
  HandlingTagId,
  RouteType,
  ShipmentId,
  ShipmentStatus,
  TierNote,
  TransportMode,
} from "./shipment-data";

/** Text of /dashboard/logistics: the screen's UI and the demo shipments' business wording. */
export interface LogisticsMessages {
  readonly meta: PageMeta;
  readonly list: {
    readonly title: string;
    readonly filter: string;
    /** Placeholders: `{count}`. */
    readonly tabs: {
      readonly all: string;
      readonly inTransit: string;
      readonly delivered: string;
      readonly delayed: string;
    };
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly cargo: string;
    /** The abbreviation is read the same in all four languages. */
    readonly eta: string;
  };
  /** The shipment number, "#SDA-01-2401". Placeholders: `{id}`. */
  readonly shipmentId: string;
  readonly sheet: {
    /** Placeholders: `{id}`. */
    readonly title: string;
    readonly fallbackTitle: string;
    readonly description: string;
  };
  readonly details: {
    readonly empty: string;
    readonly copyId: string;
    /** Placeholders: `{progress}`, the formatted percentage. */
    readonly complete: string;
    /** Placeholders: `{eta}`, `{meta}`. */
    readonly etaLine: string;
    readonly cargoDetails: string;
    readonly totalWeight: string;
    readonly transportMode: string;
    readonly status: string;
    /** Placeholders: `{mode}`, `{route}`. */
    readonly modeRoute: string;
    readonly tabs: {
      readonly overview: string;
      readonly route: string;
      readonly cargo: string;
      readonly documents: string;
      readonly activity: string;
    };
    readonly comingSoon: {
      readonly route: string;
      readonly cargo: string;
      readonly documents: string;
      readonly activity: string;
    };
    readonly contact: Readonly<Record<TransportMode, string>>;
    readonly transportNumber: Readonly<Record<TransportMode, string>>;
  };
  readonly mapLabel: string;
  readonly statuses: Readonly<Record<ShipmentStatus, string>>;
  readonly modes: Readonly<Record<TransportMode, string>>;
  readonly routeTypes: Readonly<Record<RouteType, string>>;
  readonly tiers: Readonly<Record<CustomerTier, string>>;
  /** `topVolume` takes `{share}`, the formatted percentage. */
  readonly tierNotes: Readonly<Record<TierNote, string>>;
  readonly etaNotes: Readonly<Record<EtaNote, string>>;
  /** How a place is named; a city is shown by its bare name. Placeholders: `{name}`. */
  readonly places: { readonly airport: string; readonly port: string; readonly portOf: string };
  readonly handlingLabels: Readonly<Record<HandlingLabelId, string>>;
  readonly handlingTags: Readonly<Record<HandlingTagId, string>>;
  /**
   * Demo business text per shipment. `note` takes `{temperature}`, a formatted temperature, where a note quotes
   * one; the other notes ignore it.
   */
  readonly shipments: Readonly<Record<ShipmentId, { readonly cargo: string; readonly note: string }>>;
}

export const logisticsMessageKey: MessageKey<LogisticsMessages> = messageKey<LogisticsMessages>("logistics");

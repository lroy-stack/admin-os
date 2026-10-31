import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { LandmarkKind, TableShape } from "./floor/floor-model";
import type { VisibleTableState } from "./floor/table-state";
import type { AllergyId, Channel, GuestLanguage, NoteId, ReservationStatus, TagId } from "./reservations-data";

/**
 * Text of /dashboard/bookings (Today's Reservations): the service screen, the floor plan with its legend and
 * callouts, the room editor and the demo reservations. Guest surnames are proper nouns and stay in the data.
 */
export interface BookingsMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly kpis: {
    readonly seated: string;
    /** Placeholders: `{guest}`, `{party}`. */
    readonly nextArrival: string;
    readonly noMoreArrivals: string;
    readonly tablesFree: string;
  };
  readonly views: {
    readonly label: string;
    readonly floor: string;
    readonly agenda: string;
    readonly list: string;
  };
  readonly alerts: {
    readonly label: string;
    readonly unassigned: string;
    readonly late: string;
    readonly pending: string;
  };
  readonly actions: {
    readonly walkIn: string;
    readonly newReservation: string;
    readonly arrivals: string;
    readonly tools: string;
    readonly showClosed: string;
    readonly editRoom: string;
    readonly fullView: string;
    readonly exitFullView: string;
    readonly fullViewRegion: string;
  };
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly stepper: {
    readonly label: string;
    readonly previousDay: string;
    readonly today: string;
    readonly nextDay: string;
  };
  readonly empty: { readonly title: string; readonly description: string; readonly backToToday: string };
  /** Placeholders: `{count}`. A party of guests, in sentences. */
  readonly party: Plural;
  /** Placeholders: `{count}`. The compact form for pills and timeline bars. */
  readonly partyShort: string;
  /** Placeholders: `{count}`. */
  readonly seats: Plural;
  readonly assign: {
    /** Placeholders: `{guest}`, `{party}`; `{count}` (the tables that fit) picks the form. */
    readonly prompt: Plural;
    /** Placeholders: `{party}`, `{time}`. */
    readonly noneFit: string;
    readonly stop: string;
  };
  readonly rail: {
    readonly title: string;
    /** Placeholders: `{time}`, `{arrivals}`, `{free}`. */
    readonly summary: string;
    readonly closed: string;
    readonly fold: string;
    readonly show: string;
    readonly now: string;
    readonly noArrivals: string;
    /** Placeholders: `{count}`. */
    readonly arrivals: Plural;
    /** Placeholders: `{count}`, the free seats. */
    readonly free: string;
    /** Placeholders: `{arrivals}` (already worded), `{guests}` (already worded). */
    readonly slotLine: string;
    /** Placeholders: `{time}`, `{arrivals}`. */
    readonly slotLabel: string;
    /** Placeholders: `{time}`; `{count}` (the folded reservations) picks the form. */
    readonly before: Plural;
    readonly assign: string;
    /** Placeholders: `{percent}`. */
    readonly occupancy: string;
    readonly dragHint: string;
  };
  readonly sheets: {
    /** Placeholders: `{label}`. */
    readonly tableTitle: string;
    readonly tableDescription: string;
    readonly editTitle: string;
    readonly editDescription: string;
  };
  readonly status: Readonly<Record<ReservationStatus, string>>;
  readonly nextAction: {
    readonly confirm: string;
    /** Placeholders: `{table}`. */
    readonly seat: string;
    readonly complete: string;
  };
  readonly late: {
    /** Placeholders: `{minutes}`. */
    readonly short: string;
    readonly long: string;
  };
  readonly channels: Readonly<Record<Channel, string>>;
  /** Name of a walk-in party, which has no surname. */
  readonly walkInGuest: string;
  readonly tagsLabel: string;
  readonly tags: Readonly<Record<TagId, string>>;
  readonly notes: Readonly<Record<NoteId, string>>;
  readonly allergies: Readonly<Record<AllergyId, string>>;
  readonly languages: Readonly<Record<GuestLanguage, string>>;
  readonly list: {
    readonly arrival: string;
    readonly guest: string;
    readonly party: string;
    readonly table: string;
    readonly status: string;
    readonly channel: string;
    readonly noTable: string;
    readonly empty: string;
  };
  readonly agenda: {
    readonly table: string;
    readonly noTable: string;
    /** Placeholders: `{party}`. */
    readonly toAssign: string;
    /** Placeholders: `{party}`, `{zone}`. */
    readonly laneSubtitle: string;
  };
  readonly drawer: {
    /** Placeholders: `{party}`, `{from}`, `{to}`, `{channel}`. */
    readonly summary: string;
    /** Placeholders: `{label}`. */
    readonly table: string;
    readonly noTableYet: string;
    readonly moreActions: string;
    readonly markNoShow: string;
    readonly cancelReservation: string;
    readonly guest: string;
    readonly visits: string;
    readonly averageSpend: string;
    readonly lastVisit: string;
    readonly language: string;
    readonly firstVisit: string;
    readonly today: string;
    readonly details: string;
    readonly phone: string;
    readonly email: string;
    readonly allergies: string;
    readonly noneRecorded: string;
    readonly bookingNote: string;
  };
  readonly tableState: Readonly<Record<VisibleTableState, string>>;
  readonly reading: {
    readonly blocked: string;
    readonly seated: string;
    /** Placeholders: `{duration}`. */
    readonly leavesIn: string;
    readonly overBy: string;
    readonly freeFor: string;
    /** Placeholders: `{minutes}`. */
    readonly late: string;
    readonly lateNoBooking: string;
    /** Placeholders: `{time}`. */
    readonly arrives: string;
    readonly arriving: string;
    readonly freeTonight: string;
    readonly blockedToday: string;
  };
  readonly duration: {
    /** Placeholders: `{minutes}`. */
    readonly minutes: string;
    /** Placeholders: `{hours}`. */
    readonly hours: string;
    /** Placeholders: `{hours}`, `{minutes}`. */
    readonly hoursMinutes: string;
  };
  readonly callout: {
    /** Placeholders: `{seats}` (already worded), `{zone}`. */
    readonly seatsInZone: string;
    readonly details: string;
    readonly guestsToSeat: string;
    readonly fewer: string;
    readonly more: string;
    /** Placeholders: `{count}`. */
    readonly seat: Plural;
  };
  readonly floor: {
    readonly level: string;
    readonly cameraAngle: string;
    readonly camera: string;
    readonly zoomIn: string;
    readonly zoomOut: string;
    readonly fit: string;
    readonly rotate: string;
    readonly tablesByState: string;
    /** Placeholders: `{label}`, `{seats}`. */
    readonly plateEdit: string;
    /** Placeholders: `{label}`, `{seats}`, `{state}`, `{reading}`. */
    readonly plateService: string;
    readonly views: { readonly flat: string; readonly isometric: string; readonly perspective: string };
  };
  readonly editor: {
    /** Placeholders: `{level}`. */
    readonly editing: string;
    readonly addTable: string;
    /** Placeholders: `{zone}`. */
    readonly intoZone: string;
    /** Placeholders: `{shape}`, `{count}`. */
    readonly preset: string;
    readonly addElement: string;
    readonly addZone: string;
    readonly addLevel: string;
    readonly panel: string;
    readonly undo: string;
    readonly more: string;
    readonly reset: string;
    readonly done: string;
    /** Placeholders: `{number}`. Names given to new zones and levels, which then belong to the user. */
    readonly newZone: string;
    readonly newLevel: string;
    readonly clearSelection: string;
    /** Placeholders: `{label}`. */
    readonly tableTitle: string;
    readonly fields: {
      readonly label: string;
      readonly shape: string;
      readonly seats: string;
      readonly x: string;
      readonly y: string;
      readonly width: string;
      readonly depth: string;
      readonly rotation: string;
      /** Placeholders: `{degrees}`. */
      readonly rotateLeft: string;
      readonly rotateRight: string;
      readonly inService: string;
      readonly duplicate: string;
      readonly delete: string;
      readonly leadsTo: string;
      readonly chooseLevel: string;
      readonly name: string;
      readonly outdoor: string;
      readonly wallHeight: string;
      readonly deleteZone: string;
      readonly levelName: string;
      readonly zones: string;
      /** Placeholders: `{tables}` (already worded), `{kind}`. */
      readonly zoneSummary: string;
      readonly tablesCount: Plural;
      readonly outdoorKind: string;
      readonly indoorKind: string;
      readonly editZone: string;
      readonly removeLevel: string;
      readonly hint: string;
    };
    readonly warnings: {
      readonly label: string;
      /** Placeholders: `{table}`, `{zone}`. */
      readonly outside: string;
      /** Placeholders: `{table}`, `{other}`. */
      readonly overlap: string;
    };
    readonly kinds: Readonly<Record<LandmarkKind, string>>;
    readonly shapes: Readonly<Record<TableShape, string>>;
  };
  /**
   * Names of the demo room's levels, zones and landmarks by id. They apply until someone renames an element, so the
   * names follow the language and a rename sticks.
   */
  readonly venue: {
    readonly levels: Readonly<Record<string, string>>;
    readonly zones: Readonly<Record<string, string>>;
    readonly landmarks: Readonly<Record<string, string>>;
  };
}

export const bookingsMessageKey: MessageKey<BookingsMessages> = messageKey<BookingsMessages>("bookings");

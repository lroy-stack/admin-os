import { z } from "zod";

import type { Channel as MediumId } from "@/core/channels";
import type { BusinessClock } from "@/core/clock";
import type { Booking, BookingStatus } from "@/modules/bookings";
import type { Customer } from "@/modules/customers";

/**
 * The bookings screen's view model: what the list, the agenda, the drawer, the floor and the rail draw. It is the
 * module's `Booking` (plus the customer it names) seen from the service floor: `in_progress` reads "seated",
 * `resourceIds` are "tables" and the guest's profile comes from the customer record. `toReservations` is the one
 * place the two meet (plan 003, B1).
 */

export type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";

/** The medium the guest came by, plus the two ways a party can arrive without one. */
export type Channel = MediumId | "walk-in" | "assistant" | "unknown";

export type GuestProfile = {
  visits: number;
  /** In the business currency, in major units. */
  averageSpend: number;
  /** Days since the last visit: 0 is today, null is a first visit. */
  lastVisitDaysAgo: number | null;
  /** A locale code of the customer record ("es"); the screen names it in the active language. */
  language: string | null;
  /** Allergen ids of the customer record; the screen names them in the active language. */
  allergens: readonly string[];
};

export type Reservation = {
  id: string;
  /** A name (a proper noun). Empty for a walk-in, which the screen names in the active language. */
  guest: string;
  partySize: number;
  startMin: number;
  endMin: number;
  status: ReservationStatus;
  tableIds: string[];
  /** What the tables are called, in the same order as `tableIds` ("S3"). */
  tableLabels: string[];
  channel: Channel;
  /** Free labels staff or the guest asked for ("Gluten-free"); data, shown as written. */
  tags: readonly string[];
  /** What the guest asked for when booking. */
  note: string | null;
  /** What staff wrote about the booking. */
  staffNote: string | null;
  phone: string | null;
  email: string | null;
  /** Null when the guest has no customer record. */
  profile: GuestProfile | null;
};

export type ServiceWindow = { readonly startMin: number; readonly endMin: number };

/** The moment and the rules the screen reads a day by. */
export type ServiceDay = {
  readonly businessDay: string;
  /** Whether `businessDay` is the business clock's current day. */
  readonly isToday: boolean;
  /** Minutes since midnight as seen from `businessDay`: the clock's on today, before everything on a coming day. */
  readonly nowMin: number;
  readonly window: ServiceWindow;
  /** A confirmed party counts as running late this many minutes after its arrival time. */
  readonly lateAfterMin: number;
  /** How long a walk-in party is expected to stay. */
  readonly walkInStayMin: number;
};

const MINUTES_PER_DAY = 24 * 60;

export function reservationStatus(status: BookingStatus): ReservationStatus {
  switch (status) {
    case "pending":
    case "awaiting_payment":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "in_progress":
      return "seated";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "no_show":
      return "no_show";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

/** Who made the booking decides first for a walk-in or the assistant; otherwise the medium it came by. */
export function reservationChannel(booking: Pick<Booking, "origin" | "channel">): Channel {
  if (booking.origin === "walk_in") return "walk-in";
  if (booking.origin === "assistant") return "assistant";
  return booking.channel ?? "unknown";
}

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;

/** Whole calendar days from `from` to `to` (`YYYY-MM-DD`); negative when `to` is earlier. */
export const daysBetween = (from: string, to: string) => Math.round(dayNumber(to) - dayNumber(from));

/** The business day `days` away from `day`, calendar arithmetic in UTC so no offset can shift it. */
export function shiftDay(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The day in the URL when it is a real calendar day; otherwise the fallback (the clock's business day). */
export function businessDayFrom(param: string | undefined, fallback: string): string {
  if (param === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return fallback;
  const date = new Date(`${param}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== param ? fallback : param;
}

/** Minutes since midnight as seen from `day`: a past day is over, a coming day has not started. */
export function nowMinFor(day: string, clock: Pick<BusinessClock, "businessDay" | "nowMin">): number {
  if (day === clock.businessDay) return clock.nowMin;
  return day < clock.businessDay ? MINUTES_PER_DAY : 0;
}

const allergensSchema = z.array(z.string());

function profileOf(customer: Customer, today: string): GuestProfile {
  const { visits, spend, lastVisit } = customer.figures;
  const ext = z.object({ allergens: allergensSchema }).safeParse(customer.ext);
  return {
    visits,
    averageSpend: spend !== null && visits > 0 ? spend.amountMinor / 100 / visits : 0,
    lastVisitDaysAgo: lastVisit === null ? null : Math.max(0, daysBetween(lastVisit.slice(0, 10), today)),
    language: customer.locale ?? null,
    allergens: ext.success ? ext.data.allergens : [],
  };
}

/** The ids of the customers a day's bookings name, once each: the guests to read. */
export function customerIdsOf(bookings: readonly Booking[]): string[] {
  return [...new Set(bookings.flatMap((booking) => (booking.customerId === undefined ? [] : [booking.customerId])))];
}

/** What the day's bookings are read against: the guests and the places on record, and the business day's today. */
export type ReservationContext = {
  readonly today: string;
  /** Customers by id; a booking whose customer is missing reads as a guest without a record. */
  readonly customers: ReadonlyMap<string, Customer>;
  /** Resource labels by id; a resource that is missing is called by its id. */
  readonly resourceLabels: ReadonlyMap<string, string>;
};

export function toReservation(booking: Booking, context: ReservationContext): Reservation {
  const customer = booking.customerId === undefined ? undefined : context.customers.get(booking.customerId);
  return {
    id: booking.id,
    guest: customer?.name ?? booking.contactName ?? "",
    partySize: booking.partySize,
    startMin: booking.startMin,
    endMin: booking.endMin,
    status: reservationStatus(booking.status),
    tableIds: [...booking.resourceIds],
    tableLabels: booking.resourceIds.map((id) => context.resourceLabels.get(id) ?? id),
    channel: reservationChannel(booking),
    tags: booking.tags,
    note: booking.guestNote ?? null,
    staffNote: booking.staffNote ?? null,
    phone: customer?.phone ?? null,
    email: customer?.email ?? null,
    profile: customer === undefined ? null : profileOf(customer, context.today),
  };
}

/** The day's bookings as the screen draws them, earliest first;  */
export function toReservations(bookings: readonly Booking[], context: ReservationContext): Reservation[] {
  return bookings.map((booking) => toReservation(booking, context)).sort((a, b) => a.startMin - b.startMin);
}

/**
 * What staff changed on the screen before writes reach the data seam (plan 003, B3): patches by id and the walk-ins
 * seated since. They belong to one business day and are ignored on any other.
 */
export type LocalChanges = {
  readonly businessDay: string;
  readonly patches: Readonly<Record<string, Partial<Reservation>>>;
  readonly walkIns: readonly Reservation[];
};

export const noLocalChanges = (businessDay: string): LocalChanges => ({ businessDay, patches: {}, walkIns: [] });

/** The changes to build on for `businessDay`: those made on it, or none when they were made on another day. */
const changesFor = (changes: LocalChanges, businessDay: string) =>
  changes.businessDay === businessDay ? changes : noLocalChanges(businessDay);

/** `change` applied to the reservation `id` of `businessDay`, on top of what was already changed there. */
export function patchLocal(
  changes: LocalChanges,
  businessDay: string,
  id: string,
  change: Partial<Reservation>,
): LocalChanges {
  const current = changesFor(changes, businessDay);
  return { ...current, patches: { ...current.patches, [id]: { ...current.patches[id], ...change } } };
}

/** A walk-in seated on `businessDay`. */
export function addLocalWalkIn(changes: LocalChanges, businessDay: string, walkIn: Reservation): LocalChanges {
  const current = changesFor(changes, businessDay);
  return { ...current, walkIns: [...current.walkIns, walkIn] };
}

export function withLocalChanges(
  reservations: readonly Reservation[],
  changes: LocalChanges,
  businessDay: string,
): Reservation[] {
  if (changes.businessDay !== businessDay) return [...reservations];
  return [
    ...reservations.map((reservation) => ({ ...reservation, ...changes.patches[reservation.id] })),
    ...changes.walkIns,
  ];
}

/** The hour marks of the agenda's time axis, from the window's start. */
export function hourMarks(window: ServiceWindow): number[] {
  const count = Math.floor((window.endMin - window.startMin) / 60) + 1;
  return Array.from({ length: count }, (_, index) => window.startMin + index * 60);
}

/** Where `minute` sits along the window, as a CSS percentage. */
export const percentInWindow = (window: ServiceWindow, minute: number) =>
  `${((minute - window.startMin) / (window.endMin - window.startMin)) * 100}%`;

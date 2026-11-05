import { type Locale, languageName } from "@/core/i18n/client";
import type { Customer, CustomerNote } from "@/modules/customers";

/** Visits kept out of every visit that was booked; null when nothing was ever booked, so there is no ring to draw. */
export interface Attendance {
  readonly kept: number;
  readonly booked: number;
  /** Between 0 and 1. */
  readonly ratio: number;
}

export function attendanceOf(figures: Pick<Customer["figures"], "visits" | "noShows">): Attendance | null {
  const booked = figures.visits + figures.noShows;
  return booked === 0 ? null : { kept: figures.visits, booked, ratio: figures.visits / booked };
}

/** The instant of a note as the business wrote it: the day's midnight plus the minute, read as wall-clock time in UTC. */
export function noteMoment(note: Pick<CustomerNote, "day" | "minute">): Date {
  return new Date(Date.parse(`${note.day}T00:00:00Z`) + note.minute * 60_000);
}

/** Newest first. Notes are stored oldest first, so equal moments keep the later-written note on top. Does not change its input. */
export function newestFirst(notes: readonly CustomerNote[]): CustomerNote[] {
  return notes.toReversed().toSorted((a, b) => noteMoment(b).getTime() - noteMoment(a).getTime());
}

export type ConsentState = "granted" | "declined" | "unknown";

/** `consent` is absent when the customer was never asked, which is not the same as having declined. */
export function consentOf(consent: Customer["consent"]): ConsentState {
  if (consent === undefined) return "unknown";
  return consent.marketing ? "granted" : "declined";
}

/** The contact details as the Contact tab lists them; null where the customer gave nothing. */
export interface ContactDetails {
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly language: string | null;
}

export function contactOf(
  customer: Pick<Customer, "name" | "email" | "phone" | "locale">,
  locale: Locale,
): ContactDetails {
  return {
    name: customer.name,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    language: customer.locale === undefined ? null : languageName(customer.locale, locale),
  };
}

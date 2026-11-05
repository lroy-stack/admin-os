import type { ComponentType } from "react";

import type { Control } from "react-hook-form";
import type { z } from "zod";

/**
 * The slots the bookings route declares (ADR 0017 §4): a module fills one through its manifest's `slots`, and the route
 * works without it. They name what the New reservation window needs of a guest, never a module.
 */
export const BOOKING_SLOTS = {
  /** Server loader, `{ ids }`: the records of the guests a day's bookings name. */
  guests: "bookings.guests",
  /** Server loader, `{ text, limit }`: the guests whose name or phone contain `text`. */
  guestSearch: "bookings.guest-search",
  /** Client fill (`ContactFieldsFill`), its dictionary and the write that creates the contact. */
  contactFields: "bookings.contact-fields",
} as const;

export type BookingSlotId = (typeof BOOKING_SLOTS)[keyof typeof BOOKING_SLOTS];

/** What the contact fields hold while a person types: every value is text. */
export interface ContactInput {
  name: string;
  phone: string;
  email: string;
}

/** What a valid contact yields: a blank phone or email is absent. */
export interface ContactValues {
  name: string;
  phone?: string | undefined;
  email?: string | undefined;
}

/** The form schema of a new contact: the filler judges what a person typed, in the screen's language. */
export type ContactSchema = z.ZodType<ContactValues, ContactInput>;

/** The fill of `bookings.contact-fields`: the fields of a new contact, the schema that judges them and the write input. */
export interface ContactFieldsFill {
  /** Takes `useWindowForm(...).form.control` of a form whose values extend `ContactInput`. */
  readonly Fields: ComponentType<{
    readonly control: Control<ContactInput, unknown, ContactValues>;
    readonly readOnly?: boolean;
  }>;
  /** A hook: the schema reads the dictionary the screen mounts for the slot. */
  readonly useSchema: () => ContactSchema;
  /** The input of the write the slot's descriptor names. */
  readonly toCreateInput: (values: ContactValues) => unknown;
}

/** The client fills the route takes, by slot id; `SLOT_FILLS` is checked against it by assignment, not by import. */
export interface BookingSlots {
  readonly "bookings.contact-fields": ContactFieldsFill;
}

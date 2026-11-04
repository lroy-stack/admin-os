import { z } from "zod";

import { type Channel, channelSchema } from "@/core/channels";
import type { ActionOutcome } from "@/ds/forms";
import { type ContactFormInput, type ContactFormValues, contactFormSchema } from "@/modules/customers/ui";

/** Most guests the panel's stepper offers; the capability itself allows more, for a booking on joined tables. */
export const MAX_RESERVATION_COVERS = 40;

const NOTE_MAX = 500;
const TAG_MAX = 40;
const TAGS_MAX = 20;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export type GuestMode = "existing" | "new";

/** What the panel's controls hold while a person works: every value is text or a count. */
export interface ReservationFormInput extends ContactFormInput {
  mode: GuestMode;
  /** The customer picked by the search; blank until one is. */
  customerId: string;
  date: string;
  covers: number;
  /** The slot's start minute as text, or blank until one is picked. */
  startMin: string;
  /** The chosen table, blank for "automatic". */
  tableId: string;
  channel: Channel;
  note: string;
  /** Labels separated by commas. */
  tags: string;
}

export type ReservationGuest =
  | { readonly kind: "existing"; readonly customerId: string }
  | { readonly kind: "new"; readonly contact: ContactFormValues };

/** What a valid form yields. */
export interface ReservationFormValues {
  readonly guest: ReservationGuest;
  readonly date: string;
  readonly covers: number;
  readonly startMin: number;
  readonly tableId: string;
  readonly channel: Channel;
  readonly note: string;
  readonly tags: readonly string[];
}

export interface ReservationFormText {
  readonly guestRequired: string;
  readonly dateInvalid: string;
  readonly coversInvalid: string;
  readonly slotRequired: string;
  readonly noteTooLong: string;
  readonly tagsInvalid: string;
}

type GuestResult =
  | { readonly ok: true; readonly guest: ReservationGuest }
  | { readonly ok: false; readonly issues: readonly { message: string; path: PropertyKey[] }[] };

/** The default values of an opening: a day, a party and the channel staff most often take bookings by. */
export const emptyReservation = (date: string, covers: number): ReservationFormInput => ({
  mode: "existing",
  customerId: "",
  name: "",
  phone: "",
  email: "",
  date,
  covers,
  startMin: "",
  tableId: "",
  channel: "phone",
  note: "",
  tags: "",
});

/** The labels typed as `a, b`: trimmed, blanks and repeats dropped, in the order typed. */
export function parseTags(text: string): string[] {
  return [
    ...new Set(
      text
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
    ),
  ];
}

const fields = (text: ReservationFormText) =>
  z.object({
    mode: z.enum(["existing", "new"]),
    customerId: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    date: z.string().regex(DAY, text.dateInvalid),
    covers: z
      .number(text.coversInvalid)
      .int(text.coversInvalid)
      .min(1, text.coversInvalid)
      .max(MAX_RESERVATION_COVERS, text.coversInvalid),
    startMin: z.string().min(1, text.slotRequired),
    tableId: z.string(),
    channel: channelSchema,
    note: z.string().trim().max(NOTE_MAX, text.noteTooLong),
    tags: z.string(),
  });

/**
 * The form schema of the New reservation panel. The guest is either a customer picked from the search or a new contact,
 * judged by the shared contact schema (`contactFormSchema`); the other fields follow `bookings.create`. The capability
 * validates the same bounds again on the server (ADR 0005).
 */
export function reservationFormSchema(
  text: ReservationFormText,
  contactInvalid: Parameters<typeof contactFormSchema>[0],
): z.ZodType<ReservationFormValues, ReservationFormInput> {
  const contact = contactFormSchema(contactInvalid);

  /** Who the booking is for, or the issues that say why not. */
  const guestOf = (input: z.infer<ReturnType<typeof fields>>): GuestResult => {
    if (input.mode === "existing") {
      return input.customerId === ""
        ? { ok: false, issues: [{ message: text.guestRequired, path: ["customerId"] }] }
        : { ok: true, guest: { kind: "existing", customerId: input.customerId } };
    }
    const parsed = contact.safeParse({ name: input.name, phone: input.phone, email: input.email });
    return parsed.success
      ? { ok: true, guest: { kind: "new", contact: parsed.data } }
      : { ok: false, issues: parsed.error.issues.map(({ message, path }) => ({ message, path })) };
  };
  const tagsAreValid = (tags: readonly string[]) =>
    tags.length <= TAGS_MAX && tags.every((tag) => tag.length <= TAG_MAX);

  // The checks run first so every problem shows at once; the transform only shapes a form that passed them.
  return fields(text)
    .superRefine((input, ctx) => {
      const found = guestOf(input);
      if (!found.ok) {
        for (const { message, path } of found.issues) ctx.issues.push({ code: "custom", message, path, input });
      }
      if (!tagsAreValid(parseTags(input.tags))) {
        ctx.issues.push({ code: "custom", message: text.tagsInvalid, path: ["tags"], input });
      }
    })
    .transform((input): ReservationFormValues => {
      const found = guestOf(input);
      if (!found.ok) return z.NEVER;
      return {
        guest: found.guest,
        date: input.date,
        covers: input.covers,
        startMin: Number(input.startMin),
        tableId: input.tableId,
        channel: input.channel,
        note: input.note,
        tags: parseTags(input.tags),
      };
    });
}

/** The `bookings.create` input for a valid form and the customer it names; blank notes and no table are left out. */
export function toCreateBookingInput(values: ReservationFormValues, customerId: string) {
  return {
    businessDay: values.date,
    startMin: values.startMin,
    partySize: values.covers,
    customerId,
    channel: values.channel,
    ...(values.tableId === "" ? {} : { resourceIds: [values.tableId] }),
    ...(values.note === "" ? {} : { guestNote: values.note }),
    ...(values.tags.length === 0 ? {} : { tags: [...values.tags] }),
  };
}

/** The field each refusal of `bookings.create` belongs to; the others stay form-level. */
const FIELD_OF_REFUSAL: Readonly<Record<string, "startMin" | "tableId">> = {
  "bookings.not_enough_seats": "tableId",
  "bookings.resource_busy": "tableId",
  "bookings.outside_window": "startMin",
  "bookings.off_grid": "startMin",
};

/**
 * A refusal the form can point at becomes an issue on its field, so the person sees it under the slot or the table; the
 * form shows it at the foot when that field is not on screen. Every other outcome passes unchanged.
 */
export function pointAtField<O>(outcome: ActionOutcome<O> | null): ActionOutcome<O> | null {
  if (outcome?.status !== "error") return outcome;
  const field = FIELD_OF_REFUSAL[outcome.code];
  return field === undefined ? outcome : { status: "invalid", issues: [{ path: [field], message: outcome.text }] };
}

/** What the toast and the day switch need of the booking just created. */
export function createdBooking(
  value: unknown,
): { id: string; businessDay: string; startMin: number; partySize: number } | null {
  const parsed = z
    .object({ id: z.string().min(1), businessDay: z.string(), startMin: z.number(), partySize: z.number() })
    .safeParse(value);
  return parsed.success ? parsed.data : null;
}

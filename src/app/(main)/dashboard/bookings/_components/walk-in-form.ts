import { z } from "zod";

import { MAX_WALK_IN_COVERS } from "./walk-in-options";

/** The longest guest name `bookings.walk_in.seat` accepts. */
const NAME_MAX = 120;

/**
 * What the Walk-in window asks for. The table is not a field: the window selects the closest free fit and the host
 * may pick another from the suggestions, so a table is always one the day showed as free. The capability's own schema
 * validates the same bounds again on the server (ADR 0005).
 */
export const walkInFormSchema = (text: { coversInvalid: string; nameTooLong: string }) =>
  z.object({
    covers: z
      .number(text.coversInvalid)
      .int(text.coversInvalid)
      .min(1, text.coversInvalid)
      .max(MAX_WALK_IN_COVERS, text.coversInvalid),
    name: z.string().trim().max(NAME_MAX, text.nameTooLong),
  });

export type WalkInFormValues = z.infer<ReturnType<typeof walkInFormSchema>>;

/** The `bookings.walk_in.seat` input for the form's values and the table chosen; a blank name is left out. */
export function toSeatInput(values: WalkInFormValues, tableId: string) {
  return {
    partySize: values.covers,
    resourceIds: [tableId],
    ...(values.name === "" ? {} : { contactName: values.name }),
  };
}

/** The id of the booking a seated walk-in returns, or null if the answer is not a booking. */
export function seatedBookingId(value: unknown): string | null {
  const parsed = z.object({ id: z.string().min(1) }).safeParse(value);
  return parsed.success ? parsed.data.id : null;
}

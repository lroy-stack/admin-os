import { z } from "zod";

import { customerBlockInput, customerNoteAddInput } from "../schema";

/**
 * A required text field whose value must pass `rule`, one of the capability's own field schemas, so the limits
 * (2000 characters for a note, 500 for a reason) have one source. A failure reads `invalid` from the dictionary.
 */
const requiredText = (rule: z.ZodType<string>, invalid: string) =>
  z.object({
    text: z.string().transform((text, ctx): string => {
      const parsed = rule.safeParse(text);
      if (parsed.success) return parsed.data;
      ctx.issues.push({ code: "custom", message: invalid, input: text });
      return z.NEVER;
    }),
  });

export const noteFormSchema = (invalid: string) => requiredText(customerNoteAddInput.shape.text, invalid);
export const blockFormSchema = (invalid: string) => requiredText(customerBlockInput.shape.reason, invalid);

/** The longest note and reason the capabilities accept, for the textarea's `maxLength`: typing stops at the limit. */
export const NOTE_MAX_LENGTH = customerNoteAddInput.shape.text.maxLength ?? undefined;
export const REASON_MAX_LENGTH = customerBlockInput.shape.reason.maxLength ?? undefined;

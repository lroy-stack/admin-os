import { z } from "zod";

import { normalisePhone } from "../contact";
import { customerCreateInput } from "../schema";
import type { ContactFieldsMessages } from "./messages";

/** What the contact fields hold while a person types: every value is text. */
export interface ContactFormInput {
  name: string;
  phone: string;
  email: string;
}

/** What a valid form yields: a blank phone or email is absent and the phone is E.164. */
export interface ContactFormValues {
  name: string;
  phone?: string | undefined;
  email?: string | undefined;
}

export const EMPTY_CONTACT: ContactFormInput = { name: "", phone: "", email: "" };

const blankToUndefined = (text: string): string | undefined => (text.trim() === "" ? undefined : text.trim());

/**
 * A text field whose value must pass `rule`, one of the create schema's own field schemas: the bounds and formats
 * have one source. A failure reads `message` from the dictionary instead of the schema's English default.
 */
const field = <O>(rule: z.ZodType<O>, message: string, prepare: (text: string) => string | undefined) =>
  z.string().transform((text, ctx): O => {
    const parsed = rule.safeParse(prepare(text));
    if (parsed.success) return parsed.data;
    ctx.issues.push({ code: "custom", message, input: text });
    return z.NEVER;
  });

/**
 * The form schema of the contact fields, derived from `customerCreateInput`. The phone accepts what people type
 * (spaces, dashes, a leading 00) and is normalised to E.164 before the create schema judges it; national formats
 * stay as typed and are rejected, as the capability does not guess a country.
 */
export function contactFormSchema(
  messages: ContactFieldsMessages["invalid"],
): z.ZodType<ContactFormValues, ContactFormInput> {
  const { name, phone, email } = customerCreateInput.shape;
  return z.object({
    name: field(name, messages.name, (text) => text),
    phone: field(phone, messages.phone, (text) => {
      const typed = blankToUndefined(text);
      return typed === undefined ? undefined : normalisePhone(typed);
    }),
    email: field(email, messages.email, blankToUndefined),
  });
}

/** The input of `customers.create` for a valid form: a field left blank is not sent. */
export function toCreateInput({ name, phone, email }: ContactFormValues) {
  return { name, ...(phone === undefined ? {} : { phone }), ...(email === undefined ? {} : { email }) };
}

/**
 * The input of `customers.contact.update` for a valid form. A blank phone or email is `null`, which clears it: an
 * omitted field would mean "unchanged", so the person who emptied a field would see it come back.
 */
export function toUpdateInput(id: string, { name, phone, email }: ContactFormValues) {
  return { id, name, phone: phone ?? null, email: email ?? null };
}

/**
 * The phone and email a person has typed that are complete enough to look up in `customers.duplicates.check`, or
 * `null` when neither is: a half-typed number or address matches nothing worth showing. The phone is E.164.
 */
export function contactQuery({ phone, email }: ContactFormInput): { phone?: string; email?: string } | null {
  const { phone: phoneRule, email: emailRule } = customerCreateInput.shape;
  const typedPhone = blankToUndefined(phone);
  const normalised = typedPhone === undefined ? undefined : normalisePhone(typedPhone);
  const validPhone = normalised !== undefined && phoneRule.safeParse(normalised).success ? normalised : undefined;
  const typedEmail = blankToUndefined(email);
  const validEmail = typedEmail !== undefined && emailRule.safeParse(typedEmail).success ? typedEmail : undefined;
  if (validPhone === undefined && validEmail === undefined) return null;
  return {
    ...(validPhone === undefined ? {} : { phone: validPhone }),
    ...(validEmail === undefined ? {} : { email: validEmail }),
  };
}

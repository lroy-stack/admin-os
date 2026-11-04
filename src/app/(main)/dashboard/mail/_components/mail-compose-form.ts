import { z } from "zod";

import type { Recipient } from "./data";

/** The errors the schema reports, already translated. */
export interface MailComposeErrors {
  readonly toRequired: string;
  readonly addressInvalid: string;
  readonly subjectRequired: string;
  readonly bodyRequired: string;
}

/** The addresses typed in a To or Cc field: separated by commas, semicolons or spaces. */
export function addressesOf(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((address) => address.trim())
    .filter((address) => address !== "");
}

const isAddress = (address: string) => z.email().safeParse(address).success;

/** An address typed with no name is shown as itself. */
export function recipientsOf(text: string): Recipient[] {
  return addressesOf(text).map((email) => ({ name: email, email }));
}

/** The New email and Forward form. To and Cc stay text; the schema checks every address in them. */
export function mailComposeSchema(errors: MailComposeErrors) {
  return z.object({
    to: z
      .string()
      .refine((text) => addressesOf(text).length > 0, errors.toRequired)
      .refine((text) => addressesOf(text).every(isAddress), errors.addressInvalid),
    cc: z.string().refine((text) => addressesOf(text).every(isAddress), errors.addressInvalid),
    subject: z.string().trim().min(1, errors.subjectRequired),
    body: z.string().trim().min(1, errors.bodyRequired),
  });
}

export type MailComposeInput = z.input<ReturnType<typeof mailComposeSchema>>;
export type MailComposeValues = z.output<ReturnType<typeof mailComposeSchema>>;

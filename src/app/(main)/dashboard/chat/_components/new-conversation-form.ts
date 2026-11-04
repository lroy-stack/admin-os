import { z } from "zod";

import { channelItems } from "./data";

/** The errors the schema reports, already translated. */
export interface NewConversationErrors {
  readonly nameRequired: string;
  readonly emailInvalid: string;
  readonly subjectRequired: string;
  readonly messageRequired: string;
}

const channelIds = channelItems.map((item) => item.id);

/** The New conversation form. The email is optional; when present it must be an address. */
export function newConversationSchema(errors: NewConversationErrors) {
  return z.object({
    name: z.string().trim().min(1, errors.nameRequired),
    email: z
      .string()
      .trim()
      .refine((value) => value === "" || z.email().safeParse(value).success, errors.emailInvalid),
    channel: z.enum(channelIds as [(typeof channelIds)[number], ...(typeof channelIds)[number][]]),
    subject: z.string().trim().min(1, errors.subjectRequired),
    message: z.string().trim().min(1, errors.messageRequired),
  });
}

export type NewConversationInput = z.input<ReturnType<typeof newConversationSchema>>;
export type NewConversationValues = z.output<ReturnType<typeof newConversationSchema>>;

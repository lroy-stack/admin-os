import { z } from "zod";

/** The medium a customer reached the business by. Who created a record (staff, assistant) is not a medium. */
export const CHANNELS = [
  "phone",
  "email",
  "web",
  "in_person",
  "whatsapp",
  "instagram",
  "facebook",
  "sms",
  "google",
  "third_party",
] as const;

export const channelSchema = z.enum(CHANNELS);

export type Channel = z.infer<typeof channelSchema>;

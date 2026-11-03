import { type MessageKey, messageKey } from "@/core/i18n/client";

/** Text of the shared contact fields (name, phone, email). The dictionary is `contactFieldsBundle` in the module's server entry. */
export interface ContactFieldsMessages {
  readonly name: { readonly label: string };
  readonly phone: { readonly label: string; readonly hint: string };
  readonly email: { readonly label: string };
  /** One sentence per field, shown when its value does not pass the create schema. */
  readonly invalid: { readonly name: string; readonly phone: string; readonly email: string };
}

export const contactFieldsMessageKey: MessageKey<ContactFieldsMessages> =
  messageKey<ContactFieldsMessages>("contactFields");

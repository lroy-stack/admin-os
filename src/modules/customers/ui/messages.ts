// A type-only import: erased from the browser bundle, and it keeps the server entry, which reads this key, free of
// the client entry's React provider (ADR 0016, W0).
import type { MessageKey } from "@/core/i18n";

/** Text of the shared contact fields (name, phone, email). The dictionary is `contactFieldsBundle` in the module's server entry. */
export interface ContactFieldsMessages {
  readonly name: { readonly label: string };
  readonly phone: { readonly label: string; readonly hint: string };
  readonly email: { readonly label: string };
  /** One sentence per field, shown when its value does not pass the create schema. */
  readonly invalid: { readonly name: string; readonly phone: string; readonly email: string };
}

export const contactFieldsMessageKey: MessageKey<ContactFieldsMessages> = { namespace: "contactFields" };

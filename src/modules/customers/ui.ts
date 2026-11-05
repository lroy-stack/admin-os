import type { ModuleUi } from "@/core/views/ui";

import { ContactFields } from "./ui/contact-fields";
import { toCreateInput } from "./ui/contact-form";
import { useContactSchema } from "./ui/use-contact-schema";

export { ContactFields, type ContactFieldsProps } from "./ui/contact-fields";
export {
  type ContactFormInput,
  type ContactFormValues,
  contactFormSchema,
  contactQuery,
  EMPTY_CONTACT,
  toCreateInput,
} from "./ui/contact-form";
export { type ContactFieldsMessages, contactFieldsMessageKey } from "./ui/messages";

/**
 * The client half of the customers module (ADR 0017 §1): its fill of the bookings route's `bookings.contact-fields` slot
 * (the fields, the schema that judges them and the `customers.create` input they make), and the names its own route
 * imports. It is the only importer outside the module besides the generated client list (§5).
 */
export const customersModuleUi = {
  slots: { "bookings.contact-fields": { Fields: ContactFields, useSchema: useContactSchema, toCreateInput } },
} as const satisfies ModuleUi;

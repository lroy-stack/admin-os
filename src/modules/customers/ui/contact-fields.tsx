"use client";

import type { Control } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { useMessages } from "@/core/i18n/client";
import { FormField } from "@/ds/forms";

import type { ContactFormInput, ContactFormValues } from "./contact-form";
import { contactFieldsMessageKey } from "./messages";

export interface ContactFieldsProps {
  /** From `useWindowForm(...).form.control`, for a form whose values are `ContactFormInput`. */
  control: Control<ContactFormInput, unknown, ContactFormValues>;
  /** From `useWindowForm().awaiting`. */
  readOnly?: boolean;
}

/**
 * Name, phone and email of a contact (customers.create), shared by the New contact window and the New reservation
 * panel. Each field carries its own label, hint and error; the texts come from the `contactFields` dictionary
 * (`contactFieldsBundle`, mounted by the screen).
 */
export function ContactFields({ control, readOnly = false }: ContactFieldsProps) {
  const text = useMessages(contactFieldsMessageKey);
  return (
    <>
      <FormField control={control} name="name" label={text.name.label} readOnly={readOnly}>
        {(props) => <Input {...props} autoComplete="off" />}
      </FormField>
      <FormField
        control={control}
        name="phone"
        label={text.phone.label}
        description={text.phone.hint}
        readOnly={readOnly}
      >
        {(props) => <Input {...props} type="tel" inputMode="tel" autoComplete="off" />}
      </FormField>
      <FormField control={control} name="email" label={text.email.label} readOnly={readOnly}>
        {(props) => <Input {...props} type="email" inputMode="email" autoComplete="off" />}
      </FormField>
    </>
  );
}

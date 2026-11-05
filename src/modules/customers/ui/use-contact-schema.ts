"use client";

import { useMemo } from "react";

import { useMessages } from "@/core/i18n/client";

import { contactFormSchema } from "./contact-form";
import { contactFieldsMessageKey } from "./messages";

/** The contact form's schema with its error sentences in the screen's language, from the `contactFields` dictionary. */
export function useContactSchema() {
  const { invalid } = useMessages(contactFieldsMessageKey);
  return useMemo(() => contactFormSchema(invalid), [invalid]);
}

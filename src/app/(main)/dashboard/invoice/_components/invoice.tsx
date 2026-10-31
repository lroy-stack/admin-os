"use client";

import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { useLocale, useMessages } from "@/core/i18n/client";

import type { InvoiceFormValues } from "./data";
import { InvoiceForm } from "./invoice-form";
import { InvoicePreview } from "./invoice-preview";
import { createInvoiceSchema } from "./invoice-schema";
import { invoiceMessageKey } from "./messages";

export function Invoice({ initialInvoice }: { initialInvoice: InvoiceFormValues }) {
  const text = useMessages(invoiceMessageKey);
  const locale = useLocale();
  const schema = useMemo(() => createInvoiceSchema(text.validation, locale), [text.validation, locale]);
  const form = useForm<InvoiceFormValues>({
    defaultValues: initialInvoice,
    resolver: zodResolver(schema),
    mode: "onChange",
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  return (
    <FormProvider {...form}>
      <form className="grid gap-5 xl:grid-cols-2" noValidate onSubmit={(event) => event.preventDefault()}>
        <InvoiceForm />
        <InvoicePreview invoice={invoice} />
      </form>
    </FormProvider>
  );
}

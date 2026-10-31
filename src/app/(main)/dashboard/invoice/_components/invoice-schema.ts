import { z } from "zod";

import { format, formatNumber, formatPercent, type Locale } from "@/core/i18n/client";
import { CURRENCIES } from "@/core/money/client";

import type { InvoiceFromDetails, InvoiceToDetails } from "./data";
import type { InvoiceMessages } from "./messages";

const isoDate = (message: string) => z.string().refine((value) => !Number.isNaN(Date.parse(value)), message);

/**
 * The invoice form's schema, built for one locale: the messages are the active dictionary's `validation` slice, so
 * the same schema validates on the client (react-hook-form's resolver) and on any server that parses an invoice.
 * Numbers arrive as `NaN` from an emptied number input, hence the `error` on each `z.number`. The bounds in the
 * sentences (`{min}`, `{max}`) are formatted for the locale, never written into the dictionary.
 */
export function createInvoiceSchema(messages: InvoiceMessages["validation"], locale: Locale) {
  const text = {
    ...messages,
    quantityPositive: format(messages.quantityPositive, locale, { min: formatNumber(0, locale) }),
    percentTooHigh: format(messages.percentTooHigh, locale, { max: formatPercent(1, locale) }),
  };
  return z
    .object({
      referenceNumber: z.string().trim().min(1, text.referenceRequired),
      currency: z.enum(CURRENCIES),
      // Issuer and client come from the business settings and the client list, not from typing; no rules to apply.
      from: z.custom<InvoiceFromDetails>(),
      to: z.custom<InvoiceToDetails>(),
      issuedDate: isoDate(text.invalidDate),
      paymentDueDate: isoDate(text.invalidDate),
      taxId: z.enum(["gst", "vat", "service-tax", "none"]),
      discountType: z.enum(["fixed", "percent"]),
      discountValue: z.number({ error: text.discountNotNegative }).min(0, text.discountNotNegative),
      items: z.array(
        z.object({
          id: z.string(),
          description: z.string().trim().min(1, text.descriptionRequired),
          quantity: z.number({ error: text.quantityPositive }).gt(0, text.quantityPositive),
          unitPrice: z.number({ error: text.priceNotNegative }).min(0, text.priceNotNegative),
        }),
      ),
    })
    .superRefine((invoice, context) => {
      if (invoice.discountType === "percent" && invoice.discountValue > 100) {
        context.addIssue({ code: "custom", path: ["discountValue"], message: text.percentTooHigh });
      }
      if (Date.parse(invoice.paymentDueDate) < Date.parse(invoice.issuedDate)) {
        context.addIssue({ code: "custom", path: ["paymentDueDate"], message: text.dueBeforeIssue });
      }
    });
}

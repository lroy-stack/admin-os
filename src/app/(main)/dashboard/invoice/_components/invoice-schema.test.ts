import { describe, expect, it } from "vitest";

import { LOCALES } from "@/core/i18n";

import { createDefaultInvoice, type InvoiceFormValues, type InvoiceLineItem } from "./data";
import { createInvoiceSchema } from "./invoice-schema";
import { invoiceMessages } from "./messages.server";

const today = new Date("2026-10-31T12:00:00Z");

function validate(locale: (typeof LOCALES)[number], change: (invoice: ReturnType<typeof base>) => void) {
  const invoice = base(locale);
  change(invoice);
  const result = createInvoiceSchema(invoiceMessages[locale].validation).safeParse(invoice);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function patchFirstItem(invoice: InvoiceFormValues, patch: Partial<InvoiceLineItem>) {
  invoice.items = invoice.items.map((item, index) => (index === 0 ? { ...item, ...patch } : item));
}

function base(locale: (typeof LOCALES)[number]) {
  return createDefaultInvoice(today, "EUR", invoiceMessages[locale].demoItems);
}

describe("invoice schema", () => {
  it.each(LOCALES)("accepts the demo invoice in %s", (locale) => {
    expect(validate(locale, () => undefined)).toEqual([]);
  });

  it.each(LOCALES)("reports a zero quantity in %s", (locale) => {
    const messages = validate(locale, (invoice) => patchFirstItem(invoice, { quantity: 0 }));
    expect(messages).toEqual([invoiceMessages[locale].validation.quantityPositive]);
  });

  it.each(LOCALES)("reports an emptied number input (NaN) as a quantity problem in %s", (locale) => {
    const messages = validate(locale, (invoice) => patchFirstItem(invoice, { quantity: Number.NaN }));
    expect(messages).toEqual([invoiceMessages[locale].validation.quantityPositive]);
  });

  it.each(LOCALES)("reports an empty reference in %s", (locale) => {
    const messages = validate(locale, (invoice) => {
      invoice.referenceNumber = "  ";
    });
    expect(messages).toEqual([invoiceMessages[locale].validation.referenceRequired]);
  });

  it.each(LOCALES)("reports a due date before the issued date in %s", (locale) => {
    const messages = validate(locale, (invoice) => {
      invoice.paymentDueDate = "2026-01-01";
    });
    expect(messages).toEqual([invoiceMessages[locale].validation.dueBeforeIssue]);
  });

  it.each(LOCALES)("reports a percentage discount above 100 in %s", (locale) => {
    const messages = validate(locale, (invoice) => {
      invoice.discountType = "percent";
      invoice.discountValue = 120;
    });
    expect(messages).toEqual([invoiceMessages[locale].validation.percentTooHigh]);
  });

  it("rejects a currency the kit does not offer", () => {
    const messages = validate("en", (invoice) => {
      Object.assign(invoice, { currency: "JPY" });
    });
    expect(messages).toHaveLength(1);
  });
});

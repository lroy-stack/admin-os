import { describe, expect, it } from "vitest";

import { VERTICALS } from "@/config/vertical";
import { businessDetailsSchema } from "@/core/business";
import { format, formatNumber, formatPercent, LOCALES, placeholdersOf } from "@/core/i18n";

import { createDefaultInvoice, type InvoiceFormValues, type InvoiceLineItem, type InvoiceSeed } from "./data";
import { createInvoiceSchema } from "./invoice-schema";
import { invoiceMessages } from "./messages.server";

const today = "2026-10-31";

/** The hospitality preset's company: its business settings, the other keys of its overrides left out. */
const business = businessDetailsSchema.parse(VERTICALS.hospitality.settingsDefaults);

const seedFor = (day: string): InvoiceSeed => ({
  today: day,
  currency: "EUR",
  business,
  clients: [{ id: "C-ortega", name: "Ortega", email: "ortega@example.com", addressLines: [], taxId: "" }],
  items: [
    { id: "dish-croquetas", description: "Ham croquettes", quantity: 1, unitPrice: 11 },
    { id: "dish-arroz", description: "Seafood rice", quantity: 2, unitPrice: 24 },
  ],
  issuerName: "Alex Morgan",
});

function validate(locale: (typeof LOCALES)[number], change: (invoice: ReturnType<typeof base>) => void) {
  const invoice = base();
  change(invoice);
  const result = createInvoiceSchema(invoiceMessages[locale].validation, locale).safeParse(invoice);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

/** The dictionary sentence with its bound written for the locale, as the schema reports it. */
function sentence(locale: (typeof LOCALES)[number], key: "quantityPositive" | "percentTooHigh") {
  const params: Record<string, string> =
    key === "quantityPositive" ? { min: formatNumber(0, locale) } : { max: formatPercent(1, locale) };
  return format(invoiceMessages[locale].validation[key], locale, params);
}

function patchFirstItem(invoice: InvoiceFormValues, patch: Partial<InvoiceLineItem>) {
  invoice.items = invoice.items.map((item, index) => (index === 0 ? { ...item, ...patch } : item));
}

function base() {
  return createDefaultInvoice(seedFor(today));
}

describe("invoice schema", () => {
  it.each(LOCALES)("accepts the demo invoice in %s", (locale) => {
    expect(validate(locale, () => undefined)).toEqual([]);
  });

  it.each(LOCALES)("reports a zero quantity in %s", (locale) => {
    const messages = validate(locale, (invoice) => patchFirstItem(invoice, { quantity: 0 }));
    expect(messages).toEqual([sentence(locale, "quantityPositive")]);
  });

  it.each(LOCALES)("reports an emptied number input (NaN) as a quantity problem in %s", (locale) => {
    const messages = validate(locale, (invoice) => patchFirstItem(invoice, { quantity: Number.NaN }));
    expect(messages).toEqual([sentence(locale, "quantityPositive")]);
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
    expect(messages).toEqual([sentence(locale, "percentTooHigh")]);
  });

  it("rejects a currency the kit does not offer", () => {
    const messages = validate("en", (invoice) => {
      Object.assign(invoice, { currency: "JPY" });
    });
    expect(messages).toHaveLength(1);
  });

  it.each(LOCALES)("keeps the bounds out of the %s sentences as placeholders", (locale) => {
    const { quantityPositive, percentTooHigh } = invoiceMessages[locale].validation;
    expect([placeholdersOf(quantityPositive), placeholdersOf(percentTooHigh)]).toEqual([["min"], ["max"]]);
  });

  it.each(LOCALES)("writes the quantity bound for the locale in %s", (locale) => {
    const messages = validate(locale, (invoice) => patchFirstItem(invoice, { quantity: 0 }));
    expect(messages[0]).toContain(formatNumber(0, locale));
    expect(messages[0]).not.toContain("{");
  });

  it.each(LOCALES)("writes the percentage bound for the locale in %s", (locale) => {
    const messages = validate(locale, (invoice) => {
      invoice.discountType = "percent";
      invoice.discountValue = 120;
    });
    expect(messages[0]).toContain(formatPercent(1, locale));
    expect(messages[0]).not.toContain("{");
  });
});

describe("the demo invoice's dates", () => {
  it.each([
    ["2026-10-31", "2026-11-15"],
    ["2026-12-25", "2027-01-09"],
    ["2026-03-20", "2026-04-04"],
  ])("dates it %s and due after the business's 15 days on %s, whatever the device zone", (day, due) => {
    const invoice = createDefaultInvoice(seedFor(day));
    expect([invoice.issuedDate, invoice.paymentDueDate]).toEqual([day, due]);
  });
});

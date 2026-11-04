import { z } from "zod";

import { BUSINESS_LIMITS, type BusinessDetails, type InvoiceTaxId, invoiceTaxIds } from "@/core/business";
import { format, formatNumber, type Locale } from "@/core/i18n/client";

import type { BusinessSettingsMessages } from "./messages";

/** The window's fields as the person types them: text, with the address one line per row and numbers as digits. */
export interface BusinessFormInput {
  tradeName: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  accountHolder: string;
  accountNumber: string;
  bank: string;
  defaultTax: InvoiceTaxId;
  gst: string;
  vat: string;
  serviceTax: string;
  paymentTermsDays: string;
}

const MAX = BUSINESS_LIMITS;

/** A number as the person reads and types it in their language: "2,5" in es, de and fr, no grouping. */
const asTyped = (value: number, locale: Locale) =>
  formatNumber(value, locale, { useGrouping: false, maximumFractionDigits: 2 });

/** What the person typed as a number; a comma is the decimal separator in es, de and fr, so either one is read. */
const typedNumber = (value: string) => Number(value.replace(",", "."));

/** What the window starts with: the business's settings, as text in the person's language. */
export function toFormInput(details: BusinessDetails, locale: Locale): BusinessFormInput {
  const profile = details["business.profile"];
  const payment = details["business.payment"];
  const invoicing = details["business.invoicing"];
  return {
    tradeName: profile.tradeName,
    legalName: profile.legalName,
    taxId: profile.taxId,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    address: profile.addressLines.join("\n"),
    accountHolder: payment.accountHolder,
    accountNumber: payment.accountNumber,
    bank: payment.bank,
    defaultTax: invoicing.defaultTax,
    gst: asTyped(invoicing.taxRates.gst, locale),
    vat: asTyped(invoicing.taxRates.vat, locale),
    serviceTax: asTyped(invoicing.taxRates["service-tax"], locale),
    paymentTermsDays: asTyped(invoicing.paymentTermsDays, locale),
  };
}

const linesOf = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

/**
 * The window's schema, built for one locale from the dictionary's `validation` messages: it checks what the person
 * typed and gives back the three settings `settings.values.update` takes. The server checks them again against the
 * settings' own schemas.
 */
export function businessFormSchema(messages: BusinessSettingsMessages["validation"], locale: Locale) {
  const tooLong = (max: number) => format(messages.tooLong, locale, { max: formatNumber(max, locale) });
  const range = (message: string, bounds: { min: number; max: number }) =>
    format(message, locale, { min: formatNumber(bounds.min, locale), max: formatNumber(bounds.max, locale) });
  const text = (max: number) => z.string().trim().max(max, tooLong(max));
  const number = (message: string, bounds: { min: number; max: number }, whole: boolean) => {
    const base = z.number({ error: message }).min(bounds.min, message).max(bounds.max, message);
    return z
      .string()
      .trim()
      .min(1, message)
      .transform(typedNumber)
      .pipe(whole ? base.int(message) : base);
  };
  const rate = number(range(messages.rateRange, MAX.rate), MAX.rate, false);

  return z
    .object({
      tradeName: z.string().trim().min(1, messages.tradeNameRequired).max(MAX.tradeName, tooLong(MAX.tradeName)),
      legalName: text(MAX.legalName),
      taxId: text(MAX.taxId),
      email: z
        .string()
        .trim()
        .refine((value) => value === "" || z.email().max(MAX.email).safeParse(value).success, messages.invalidEmail),
      phone: text(MAX.phone),
      website: text(MAX.website),
      address: z
        .string()
        .refine(
          (value) => linesOf(value).length <= MAX.addressLines,
          format(messages.tooManyLines, locale, { max: formatNumber(MAX.addressLines, locale) }),
        )
        .refine((value) => linesOf(value).every((line) => line.length <= MAX.addressLine), tooLong(MAX.addressLine)),
      accountHolder: text(MAX.accountHolder),
      accountNumber: text(MAX.accountNumber),
      bank: text(MAX.bank),
      defaultTax: z.enum(invoiceTaxIds),
      gst: rate,
      vat: rate,
      serviceTax: rate,
      paymentTermsDays: number(range(messages.termsRange, MAX.paymentTermsDays), MAX.paymentTermsDays, true),
    })
    .transform(
      (values): BusinessDetails => ({
        "business.profile": {
          tradeName: values.tradeName,
          legalName: values.legalName,
          taxId: values.taxId,
          email: values.email,
          phone: values.phone,
          website: values.website,
          addressLines: linesOf(values.address),
        },
        "business.payment": {
          accountHolder: values.accountHolder,
          accountNumber: values.accountNumber,
          bank: values.bank,
        },
        "business.invoicing": {
          defaultTax: values.defaultTax,
          taxRates: { gst: values.gst, vat: values.vat, "service-tax": values.serviceTax },
          paymentTermsDays: values.paymentTermsDays,
        },
      }),
    );
}

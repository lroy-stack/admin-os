import { addDays, format, parseISO } from "date-fns";

import type { BusinessDetails, InvoiceTaxId } from "@/core/business";
// Types only from the core barrels: they are erased, so the client components that import this file stay free of zod.
import type { LocalizedText } from "@/core/i18n";
import type { Locale } from "@/core/i18n/client";
import type { Money } from "@/core/money";
import { type Currency, isCurrency, majorUnits } from "@/core/money/client";

export type { InvoiceTaxId } from "@/core/business";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceTaxOption {
  id: InvoiceTaxId;
  rate: number;
}

/** The rate of each tax the document can apply; `none` applies none. */
export type InvoiceTaxRates = Readonly<Record<Exclude<InvoiceTaxId, "none">, number>>;

export type InvoiceDiscountType = "fixed" | "percent";

export const INVOICE_PAPER_WIDTH = 816;
export const INVOICE_PAPER_HEIGHT = 1056;
export const INVOICE_PAPER_SCALE = 0.6;

export interface InvoiceFromDetails {
  name: string;
  email: string;
  phone: string;
  website: string;
  addressLines: string[];
  taxId: string;
  paymentAccountName: string;
  accountNumber: string;
  issuerName: string;
}

export interface InvoiceToDetails {
  id: string;
  name: string;
  email: string;
  addressLines: string[];
  taxId: string;
}

export interface InvoiceFormValues {
  referenceNumber: string;
  /**
   * A property of the document: it starts in the currency of its catalog lines (a `Money` keeps its own currency and
   * nothing converts), or the business currency when it has none, and the form offers every `CURRENCIES` entry.
   */
  currency: Currency;
  issuedDate: string;
  paymentDueDate: string;
  from: InvoiceFromDetails;
  to: InvoiceToDetails;
  taxId: InvoiceTaxId;
  /** A property of the document too: it starts with the business's rates (spec 008), so the totals follow them. */
  taxRates: InvoiceTaxRates;
  discountType: InvoiceDiscountType;
  discountValue: number;
  items: InvoiceLineItem[];
}

/** What a new invoice starts from: the business day, the currency, the business settings and the session's data. */
export interface InvoiceSeed {
  readonly today: string;
  readonly currency: Currency;
  readonly business: BusinessDetails;
  /** The billing clients the form offers, the first one billed: parties with a tax ID and a fiscal address. */
  readonly clients: readonly InvoiceToDetails[];
  /** The lines it starts with; items of the session's catalog. */
  readonly items: readonly InvoiceLineItem[];
  /** Who issues it: the person signed in. */
  readonly issuerName: string;
}

const NO_CLIENT: InvoiceToDetails = { id: "", name: "", email: "", addressLines: [], taxId: "" };

/**
 * The form's starting values. Dates are `yyyy-MM-dd`; `today` is the business day from `clock.get` (the business time
 * zone, never the server's), so the document is dated the same wherever the server runs. The issuer, the payment
 * details, the tax and the terms are the business settings (spec 008); the reference is a draft's, written from the
 * day, since no capability numbers invoices (spec 002, AC-C).
 */
export function createDefaultInvoice(seed: InvoiceSeed): InvoiceFormValues {
  const profile = seed.business["business.profile"];
  const payment = seed.business["business.payment"];
  const invoicing = seed.business["business.invoicing"];
  return {
    referenceNumber: `${seed.today.replaceAll("-", "")}-001`,
    currency: seed.currency,
    issuedDate: seed.today,
    paymentDueDate: format(addDays(parseISO(seed.today), invoicing.paymentTermsDays), "yyyy-MM-dd"),
    from: {
      name: profile.legalName === "" ? profile.tradeName : profile.legalName,
      email: profile.email,
      phone: profile.phone,
      website: profile.website,
      addressLines: [...profile.addressLines],
      taxId: profile.taxId,
      paymentAccountName: payment.bank === "" ? payment.accountHolder : payment.bank,
      accountNumber: payment.accountNumber,
      issuerName: seed.issuerName,
    },
    to: seed.clients[0] ?? NO_CLIENT,
    taxId: invoicing.defaultTax,
    taxRates: { ...invoicing.taxRates },
    discountType: "fixed",
    discountValue: 0,
    items: seed.items.map((line) => ({ ...line })),
  };
}

/**
 * Who a full invoice is issued to: a person or a company with a tax ID and a fiscal address (RD 1619/2012, art. 6),
 * never a customer of the agenda, who books and holds no fiscal identity. Fictitious demo data, with tax IDs that
 * cannot be real, until the parties module keeps them per business (spec 011).
 */
export const billingClients: readonly InvoiceToDetails[] = [
  {
    id: "servicios-levante",
    name: "Servicios Corporativos Levante S.L.",
    email: "facturas@servicios-levante.example",
    addressLines: ["Calle del Comercio 12", "46002 Valencia", "Spain"],
    taxId: "B00000201",
  },
  {
    id: "mediterranea-eventos",
    name: "Mediterránea de Eventos S.A.",
    email: "administracion@mediterranea-eventos.example",
    addressLines: ["Avenida del Puerto 45", "03001 Alicante", "Spain"],
    taxId: "A00000202",
  },
  {
    id: "laura-gomez",
    name: "Laura Gómez Ruiz",
    email: "laura.gomez@correo.example",
    addressLines: ["Calle Mayor 3", "30001 Murcia", "Spain"],
    taxId: "00000203Z",
  },
];

/** The fields of a catalog item an invoice line reads, declared here so the invoice names no catalog type (ADR 0017 §2). */
export interface InvoiceCatalogItem {
  readonly id: string;
  readonly name: LocalizedText;
  readonly price: Money;
}

/** A catalog item as one line: its name in the request's language and its price in its currency's major units. */
export const lineItemOf = (item: InvoiceCatalogItem, locale: Locale): InvoiceLineItem => ({
  id: item.id,
  description: item.name.translations[locale] ?? item.name.source,
  quantity: 1,
  unitPrice: majorUnits(item.price.amountMinor, item.price.currency),
});

/**
 * The currency a new invoice starts in and its lines. A line's amount is a plain number in the document's currency, so
 * the document starts in the currency of the first item, when the kit offers it, and leaves out the items priced in
 * another; with none it keeps `preferred`. Nothing converts: there are no exchange rates (`src/core/money`).
 */
export function startingLines(
  items: readonly InvoiceCatalogItem[],
  preferred: Currency,
  locale: Locale,
): { currency: Currency; items: InvoiceLineItem[] } {
  const first = items[0]?.price.currency;
  const currency = isCurrency(first) ? first : preferred;
  return {
    currency,
    items: items.filter((item) => item.price.currency === currency).map((item) => lineItemOf(item, locale)),
  };
}

/** The taxes the document offers, with its own rates; the names are in the route dictionary, keyed by `id`. */
export const invoiceTaxOptionsOf = (rates: InvoiceTaxRates): InvoiceTaxOption[] => [
  { id: "gst", rate: rates.gst },
  { id: "vat", rate: rates.vat },
  { id: "service-tax", rate: rates["service-tax"] },
  { id: "none", rate: 0 },
];

export function getLineAmount(item?: InvoiceLineItem) {
  if (!item) return 0;

  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;

  return quantity * unitPrice;
}

export function getInvoiceItems(invoice: InvoiceFormValues) {
  return invoice.items;
}

export function getInvoiceSubtotal(invoice: InvoiceFormValues) {
  return getInvoiceItems(invoice).reduce((subtotal, item) => subtotal + getLineAmount(item), 0);
}

export function getInvoiceTaxOption(invoice: InvoiceFormValues): InvoiceTaxOption {
  const options = invoiceTaxOptionsOf(invoice.taxRates);
  return options.find((taxOption) => taxOption.id === invoice.taxId) ?? { id: "none", rate: 0 };
}

export function getInvoiceTax(invoice: InvoiceFormValues) {
  const taxRate = getInvoiceTaxOption(invoice).rate;

  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) * (taxRate / 100);
}

export function getInvoiceDiscount(invoice: InvoiceFormValues) {
  const subtotal = getInvoiceSubtotal(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discount = invoice.discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;

  return Math.min(Math.max(discount, 0), subtotal);
}

export function getInvoiceTotal(invoice: InvoiceFormValues) {
  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) + getInvoiceTax(invoice);
}

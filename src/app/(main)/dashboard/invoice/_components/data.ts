import { addDays, format } from "date-fns";

import type { Currency } from "@/core/money/client";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type InvoiceTaxId = "gst" | "vat" | "service-tax" | "none";

export interface InvoiceTaxOption {
  id: InvoiceTaxId;
  rate: number;
}

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
  routingNumber: string;
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
  /** A property of the document: it starts as the business currency and the form offers every `CURRENCIES` entry. */
  currency: Currency;
  issuedDate: string;
  paymentDueDate: string;
  from: InvoiceFromDetails;
  to: InvoiceToDetails;
  taxId: InvoiceTaxId;
  discountType: InvoiceDiscountType;
  discountValue: number;
  items: InvoiceLineItem[];
}

/** Demo line items; the descriptions are business text, so the server writes them in the request's locale. */
export type InvoiceItemDescriptions = Readonly<Record<"hosting" | "analytics" | "support", string>>;

/** The form's starting values. Dates are `yyyy-MM-dd`; `today` is a parameter so the server decides the day. */
export function createDefaultInvoice(
  today: Date,
  currency: Currency,
  descriptions: InvoiceItemDescriptions,
): InvoiceFormValues {
  return {
    referenceNumber: "FL-0425",
    currency,
    issuedDate: format(today, "yyyy-MM-dd"),
    paymentDueDate: format(addDays(today, 14), "yyyy-MM-dd"),
    from: {
      name: "Weblabs Studio",
      email: "hello@weblabs.studio",
      phone: "+1-512-555-0184",
      website: "weblabs.studio",
      addressLines: ["214 Pixel Avenue", "Austin, TX 78701"],
      taxId: "WS-1029384756",
      paymentAccountName: "Mercury Business",
      routingNumber: "084009519",
      issuerName: "Alex Morgan",
    },
    to: defaultInvoiceClient,
    taxId: "vat",
    discountType: "fixed",
    discountValue: 40,
    items: [
      { id: "hosting", description: descriptions.hosting, quantity: 1, unitPrice: 3500 },
      { id: "analytics", description: descriptions.analytics, quantity: 2, unitPrice: 750 },
      { id: "support", description: descriptions.support, quantity: 1, unitPrice: 400 },
    ],
  };
}

/** Rates only; the names are in the route dictionary, keyed by `id`. */
export const invoiceTaxOptions: InvoiceTaxOption[] = [
  { id: "gst", rate: 18 },
  { id: "vat", rate: 12 },
  { id: "service-tax", rate: 10 },
  { id: "none", rate: 0 },
];

const defaultInvoiceClient: InvoiceToDetails = {
  id: "aiy-cap",
  name: "AIY Cap",
  email: "finance@aiycap.com",
  addressLines: ["One BKC, Bandra Kurla Complex", "Mumbai, Maharashtra 400051"],
  taxId: "GSTIN-27AAICA9102K1Z7",
};

export const invoiceClients: InvoiceToDetails[] = [
  {
    id: "bright-enterprises",
    name: "Bright Enterprises",
    email: "billing@brightenterprises.com",
    addressLines: ["450 Park Avenue South", "New York, NY 10016", "United States"],
    taxId: "US-EIN-84-2938475",
  },
  defaultInvoiceClient,
  {
    id: "northline-gmbh",
    name: "Northline GmbH",
    email: "ap@northline.de",
    addressLines: ["Kastanienallee 32", "10435 Berlin", "Germany"],
    taxId: "DE-VAT-219384756",
  },
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

export function getInvoiceTaxOption(invoice: InvoiceFormValues) {
  return invoiceTaxOptions.find((taxOption) => taxOption.id === invoice.taxId) ?? invoiceTaxOptions[0];
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

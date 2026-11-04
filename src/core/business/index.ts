import { z } from "zod";

import { defineSetting } from "@/core/settings";

/** The bounds of the business details, shared by the settings' schemas and the forms that edit them. */
export const BUSINESS_LIMITS = {
  tradeName: 80,
  legalName: 120,
  taxId: 40,
  email: 254,
  phone: 40,
  website: 120,
  addressLine: 120,
  addressLines: 4,
  accountHolder: 120,
  accountNumber: 40,
  bank: 80,
  rate: { min: 0, max: 100 },
  paymentTermsDays: { min: 0, max: 365 },
} as const;

const L = BUSINESS_LIMITS;

/**
 * Who the business is, for the documents it prints and the places it shows itself (ADR 0004 "business profile").
 * Values, not translations: a business writes its own name and address. A business always has a trade name, which a
 * document prints when there is no legal name; the other fields may be empty, as a business may not publish them.
 */
export const businessProfileSchema = z.strictObject({
  tradeName: z.string().trim().min(1).max(L.tradeName),
  legalName: z.string().trim().max(L.legalName),
  taxId: z.string().trim().max(L.taxId),
  email: z.union([z.literal(""), z.email().max(L.email)]),
  phone: z.string().trim().max(L.phone),
  website: z.string().trim().max(L.website),
  addressLines: z.array(z.string().trim().min(1).max(L.addressLine)).max(L.addressLines),
});

/** Where customers pay the business: printed on its documents, never used to move money. */
export const businessPaymentSchema = z.strictObject({
  accountHolder: z.string().trim().max(L.accountHolder),
  /** An IBAN or a local account number, as the bank writes it. */
  accountNumber: z.string().trim().max(L.accountNumber),
  bank: z.string().trim().max(L.bank),
});

/** The taxes a document can apply; the names are the screens' words, keyed by id. `none` applies no tax. */
export const invoiceTaxIds = ["gst", "vat", "service-tax", "none"] as const;

export type InvoiceTaxId = (typeof invoiceTaxIds)[number];

const rateSchema = z.number().min(L.rate.min).max(L.rate.max);

/** How the business bills: the tax a new document starts with, the rate of each tax, and the days to pay. */
export const businessInvoicingSchema = z.strictObject({
  defaultTax: z.enum(invoiceTaxIds),
  taxRates: z.strictObject({ gst: rateSchema, vat: rateSchema, "service-tax": rateSchema }),
  paymentTermsDays: z.number().int().min(L.paymentTermsDays.min).max(L.paymentTermsDays.max),
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type BusinessPayment = z.infer<typeof businessPaymentSchema>;
export type BusinessInvoicing = z.infer<typeof businessInvoicingSchema>;

/**
 * The registry's values are blanks a business fills in, with the product's name as the trade name, which needs no
 * translation; each preset sets its demo company (ADR 0004).
 */
export const businessProfile = defineSetting({
  key: "business.profile",
  schema: businessProfileSchema,
  defaultValue: {
    tradeName: "admin-OS",
    legalName: "",
    taxId: "",
    email: "",
    phone: "",
    website: "",
    addressLines: [],
  },
  section: "business",
  permission: "manage:settings",
  labelKey: "business.settings.profile.label",
  descriptionKey: "business.settings.profile.description",
});

export const businessPayment = defineSetting({
  key: "business.payment",
  schema: businessPaymentSchema,
  defaultValue: { accountHolder: "", accountNumber: "", bank: "" },
  section: "business",
  permission: "manage:settings",
  labelKey: "business.settings.payment.label",
  descriptionKey: "business.settings.payment.description",
});

export const businessInvoicing = defineSetting({
  key: "business.invoicing",
  schema: businessInvoicingSchema,
  defaultValue: { defaultTax: "vat", taxRates: { gst: 18, vat: 12, "service-tax": 10 }, paymentTermsDays: 14 },
  section: "business",
  permission: "manage:settings",
  labelKey: "business.settings.invoicing.label",
  descriptionKey: "business.settings.invoicing.description",
});

export const businessSettings = [businessProfile, businessPayment, businessInvoicing] as const;

/** The three settings as one value, the way the settings page and the invoice read them. */
export const businessDetailsSchema = z.object({
  [businessProfile.key]: businessProfileSchema,
  [businessPayment.key]: businessPaymentSchema,
  [businessInvoicing.key]: businessInvoicingSchema,
});

export type BusinessDetails = z.infer<typeof businessDetailsSchema>;

export const BUSINESS_KEYS = [businessProfile.key, businessPayment.key, businessInvoicing.key] as const;

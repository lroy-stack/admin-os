import { businessInvoicing, businessPayment, businessProfile } from "@/core/business";

/**
 * The salon preset's demo company: a hair studio paid on the day, at the standard VAT rate.
 * Fictional: `.example` domains, an IBAN with no valid check digits and a tax id of zeros. An adopter replaces these
 * values with their own company's in the preset's `settingsDefaults`.
 */
export const salonBusiness = {
  [businessProfile.key]: {
    tradeName: "Studio Vela",
    legalName: "Vela Estética S.L.",
    taxId: "B00000025",
    email: "billing@studio-vela.example",
    phone: "+34 600 000 202",
    website: "studio-vela.example",
    addressLines: ["Calle de las Flores 4", "46001 Valencia", "Spain"],
  },
  [businessPayment.key]: {
    accountHolder: "Vela Estética S.L.",
    accountNumber: "ES00 0000 0000 0000 0000 0202",
    bank: "Demo Bank",
  },
  [businessInvoicing.key]: { defaultTax: "vat", taxRates: { gst: 0, vat: 21, "service-tax": 0 }, paymentTermsDays: 0 },
} as const;

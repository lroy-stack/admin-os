import { businessInvoicing, businessPayment, businessProfile } from "@/core/business";

/**
 * The workshop preset's demo company: a car repair shop billing fleets at thirty days, at the standard VAT rate.
 * Fictional: `.example` domains, an IBAN with no valid check digits and a tax id of zeros. An adopter replaces these
 * values with their own company's in the preset's `settingsDefaults`.
 */
export const workshopBusiness = {
  [businessProfile.key]: {
    tradeName: "Taller Norte",
    legalName: "Taller Norte Automoción S.L.",
    taxId: "B00000033",
    email: "billing@taller-norte.example",
    phone: "+34 600 000 303",
    website: "taller-norte.example",
    addressLines: ["Polígono Norte, nave 3", "50014 Zaragoza", "Spain"],
  },
  [businessPayment.key]: {
    accountHolder: "Taller Norte Automoción S.L.",
    accountNumber: "ES00 0000 0000 0000 0000 0303",
    bank: "Demo Bank",
  },
  [businessInvoicing.key]: { defaultTax: "vat", taxRates: { gst: 0, vat: 21, "service-tax": 0 }, paymentTermsDays: 30 },
} as const;

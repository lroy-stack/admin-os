import { businessInvoicing, businessPayment, businessProfile } from "@/core/business";

/**
 * The hospitality preset's demo company: a dinner restaurant billing events and group menus at the reduced VAT rate.
 * Fictional: `.example` domains, an IBAN with no valid check digits and a tax id of zeros. An adopter replaces these
 * values with their own company's in the preset's `settingsDefaults`.
 */
export const hospitalityBusiness = {
  [businessProfile.key]: {
    tradeName: "Lumbre Bistro",
    legalName: "Lumbre Hostelería S.L.",
    taxId: "B00000017",
    email: "billing@lumbre-bistro.example",
    phone: "+34 600 000 101",
    website: "lumbre-bistro.example",
    addressLines: ["Calle de la Brasa 7", "28004 Madrid", "Spain"],
  },
  [businessPayment.key]: {
    accountHolder: "Lumbre Hostelería S.L.",
    accountNumber: "ES00 0000 0000 0000 0000 0101",
    bank: "Demo Bank",
  },
  [businessInvoicing.key]: { defaultTax: "vat", taxRates: { gst: 0, vat: 10, "service-tax": 0 }, paymentTermsDays: 15 },
} as const;

import { describe, expect, it } from "vitest";

import {
  businessInvoicing,
  businessInvoicingSchema,
  businessPayment,
  businessProfile,
  businessProfileSchema,
  businessSettings,
} from "./index";

const profile = {
  tradeName: "Example",
  legalName: "Example S.L.",
  taxId: "B00000000",
  email: "billing@business.example",
  phone: "+34 600 000 000",
  website: "business.example",
  addressLines: ["Street 1", "00000 Town"],
};

describe("the business settings", () => {
  it.each(businessSettings)("$key has a default that parses against its schema", (setting) => {
    expect(setting.schema.safeParse(setting.defaultValue).success).toBe(true);
  });

  it.each(businessSettings)("$key is changed by the owner's settings permission", (setting) => {
    expect([setting.section, setting.permission]).toEqual(["business", "manage:settings"]);
  });

  it("are the profile, the payment details and the invoicing defaults", () => {
    expect(businessSettings.map(({ key }) => key)).toEqual([
      businessProfile.key,
      businessPayment.key,
      businessInvoicing.key,
    ]);
  });
});

describe("the business profile", () => {
  it("accepts a complete profile", () => {
    expect(businessProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("refuses a blank trade name, which a document prints when there is no legal name", () => {
    expect(businessProfileSchema.safeParse({ ...profile, tradeName: "  " }).success).toBe(false);
  });

  it("accepts an empty email, as a business may not publish one", () => {
    expect(businessProfileSchema.safeParse({ ...profile, email: "" }).success).toBe(true);
  });

  it("refuses an email that is not one", () => {
    expect(businessProfileSchema.safeParse({ ...profile, email: "billing" }).success).toBe(false);
  });

  it("refuses more than four address lines", () => {
    expect(businessProfileSchema.safeParse({ ...profile, addressLines: ["a", "b", "c", "d", "e"] }).success).toBe(
      false,
    );
  });

  it("refuses a field it does not know", () => {
    expect(businessProfileSchema.safeParse({ ...profile, logo: "x" }).success).toBe(false);
  });
});

describe("the invoicing defaults", () => {
  const invoicing = { defaultTax: "vat", taxRates: { gst: 18, vat: 21, "service-tax": 10 }, paymentTermsDays: 30 };

  it("accepts a default tax, a rate per tax and the payment terms", () => {
    expect(businessInvoicingSchema.safeParse(invoicing).success).toBe(true);
  });

  it("refuses a negative rate", () => {
    expect(
      businessInvoicingSchema.safeParse({ ...invoicing, taxRates: { ...invoicing.taxRates, vat: -1 } }).success,
    ).toBe(false);
  });

  it("refuses a rate above 100 %", () => {
    expect(
      businessInvoicingSchema.safeParse({ ...invoicing, taxRates: { ...invoicing.taxRates, vat: 101 } }).success,
    ).toBe(false);
  });

  it("refuses payment terms longer than a year", () => {
    expect(businessInvoicingSchema.safeParse({ ...invoicing, paymentTermsDays: 366 }).success).toBe(false);
  });

  it("refuses a default tax it does not offer", () => {
    expect(businessInvoicingSchema.safeParse({ ...invoicing, defaultTax: "sales" }).success).toBe(false);
  });
});

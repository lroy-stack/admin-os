import { describe, expect, it } from "vitest";

import type { BusinessDetails } from "@/core/business";

import { businessFormSchema, toFormInput } from "./business-form";
import type { BusinessSettingsMessages } from "./messages";

const validation: BusinessSettingsMessages["validation"] = {
  tradeNameRequired: "name",
  invalidEmail: "email",
  tooLong: "long {max}",
  tooManyLines: "lines {max}",
  rateRange: "rate {min}-{max}",
  termsRange: "terms {min}-{max}",
};

const details: BusinessDetails = {
  "business.profile": {
    tradeName: "Lumbre Bistro",
    legalName: "Lumbre Hostelería S.L.",
    taxId: "B00000017",
    email: "billing@lumbre-bistro.example",
    phone: "+34 600 000 101",
    website: "lumbre-bistro.example",
    addressLines: ["Calle de la Brasa 7", "28004 Madrid"],
  },
  "business.payment": { accountHolder: "Lumbre", accountNumber: "ES00 0101", bank: "Demo Bank" },
  "business.invoicing": { defaultTax: "vat", taxRates: { gst: 0, vat: 10, "service-tax": 2.5 }, paymentTermsDays: 15 },
};

const schema = businessFormSchema(validation, "en");
const parse = (change: Partial<ReturnType<typeof toFormInput>>) =>
  schema.safeParse({ ...toFormInput(details, "en"), ...change });
const messagesOf = (change: Partial<ReturnType<typeof toFormInput>>) =>
  parse(change).error?.issues.map(({ path, message }) => [path.join("."), message]);

describe("the business details form", () => {
  it("gives back the settings it was filled from", () => {
    expect(parse({}).data).toEqual(details);
  });

  it("shows the address one line per row", () => {
    expect(toFormInput(details, "en").address).toBe("Calle de la Brasa 7\n28004 Madrid");
  });

  it("keeps the rates and the terms as text the person can edit", () => {
    const { vat, serviceTax, paymentTermsDays } = toFormInput(details, "en");
    expect([vat, serviceTax, paymentTermsDays]).toEqual(["10", "2.5", "15"]);
  });

  it("writes a rate with the decimal comma in Spanish", () => {
    expect(toFormInput(details, "es").serviceTax).toBe("2,5");
  });

  it("reads a rate typed with a decimal comma", () => {
    expect(parse({ serviceTax: "12,5" }).data?.["business.invoicing"].taxRates["service-tax"]).toBe(12.5);
  });

  it("drops empty address rows and trims the others", () => {
    expect(parse({ address: "  Calle 1  \n\n 28004 Madrid " }).data?.["business.profile"].addressLines).toEqual([
      "Calle 1",
      "28004 Madrid",
    ]);
  });

  it("asks for the trade name", () => {
    expect(messagesOf({ tradeName: "  " })).toEqual([["tradeName", "name"]]);
  });

  it("refuses an email that is not one", () => {
    expect(messagesOf({ email: "billing" })).toEqual([["email", "email"]]);
  });

  it("accepts an empty email", () => {
    expect(parse({ email: "" }).success).toBe(true);
  });

  it("refuses more than four address lines", () => {
    expect(messagesOf({ address: "a\nb\nc\nd\ne" })).toEqual([["address", "lines 4"]]);
  });

  it("refuses a rate above 100 %", () => {
    expect(messagesOf({ vat: "101" })).toEqual([["vat", "rate 0-100"]]);
  });

  it("refuses a rate that is not a number", () => {
    expect(messagesOf({ gst: "ten" })).toEqual([["gst", "rate 0-100"]]);
  });

  it("refuses an empty rate", () => {
    expect(messagesOf({ serviceTax: "" })).toEqual([["serviceTax", "rate 0-100"]]);
  });

  it("refuses payment terms that are not whole days", () => {
    expect(messagesOf({ paymentTermsDays: "1.5" })).toEqual([["paymentTermsDays", "terms 0-365"]]);
  });

  it("refuses a trade name longer than the setting allows", () => {
    expect(messagesOf({ tradeName: "x".repeat(81) })).toEqual([["tradeName", "long 80"]]);
  });
});

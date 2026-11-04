import { describe, expect, it } from "vitest";

import type { BusinessDetails } from "@/core/business";
import type { CatalogItem } from "@/modules/catalog";
import type { Customer } from "@/modules/customers";

import {
  clientOf,
  createDefaultInvoice,
  getInvoiceSubtotal,
  getInvoiceTax,
  type InvoiceSeed,
  lineItemOf,
  startingLines,
} from "./data";

const business: BusinessDetails = {
  "business.profile": {
    tradeName: "Lumbre Bistro",
    legalName: "Lumbre Hostelería S.L.",
    taxId: "B00000017",
    email: "billing@lumbre-bistro.example",
    phone: "+34 600 000 101",
    website: "lumbre-bistro.example",
    addressLines: ["Calle de la Brasa 7", "28004 Madrid"],
  },
  "business.payment": { accountHolder: "Lumbre Hostelería S.L.", accountNumber: "ES00 0101", bank: "Demo Bank" },
  "business.invoicing": { defaultTax: "vat", taxRates: { gst: 0, vat: 10, "service-tax": 0 }, paymentTermsDays: 15 },
};

const client = { id: "C-ortega", name: "Ortega", email: "ortega@example.com", addressLines: [], taxId: "" };
const item = { id: "dish-flan", description: "Flan de la casa", quantity: 1, unitPrice: 7.5 };

const seed = (change: Partial<InvoiceSeed> = {}): InvoiceSeed => ({
  today: "2026-10-31",
  currency: "EUR",
  business,
  clients: [client],
  items: [item],
  issuerName: "Alex Morgan",
  ...change,
});

const withInvoicing = (invoicing: Partial<BusinessDetails["business.invoicing"]>): BusinessDetails => ({
  ...business,
  "business.invoicing": { ...business["business.invoicing"], ...invoicing },
});

describe("the invoice a business starts (spec 008, AC7)", () => {
  it("is issued by the business, with its legal name, address and tax ID", () => {
    const { from } = createDefaultInvoice(seed());
    expect([from.name, from.addressLines, from.taxId]).toEqual([
      "Lumbre Hostelería S.L.",
      ["Calle de la Brasa 7", "28004 Madrid"],
      "B00000017",
    ]);
  });

  it("falls back to the trade name when the business has no legal name", () => {
    const unnamed = { ...business, "business.profile": { ...business["business.profile"], legalName: "" } };
    expect(createDefaultInvoice(seed({ business: unnamed })).from.name).toBe("Lumbre Bistro");
  });

  it("prints where the business is paid", () => {
    const { from } = createDefaultInvoice(seed());
    expect([from.paymentAccountName, from.accountNumber]).toEqual(["Demo Bank", "ES00 0101"]);
  });

  it("starts with the business's default tax and carries its rates", () => {
    const invoice = createDefaultInvoice(seed());
    expect([invoice.taxId, invoice.taxRates]).toEqual(["vat", { gst: 0, vat: 10, "service-tax": 0 }]);
  });

  it("is due after the business's payment terms", () => {
    expect(createDefaultInvoice(seed({ business: withInvoicing({ paymentTermsDays: 30 }) })).paymentDueDate).toBe(
      "2026-11-30",
    );
  });

  it("is due the day it is issued when the business is paid on receipt", () => {
    expect(createDefaultInvoice(seed({ business: withInvoicing({ paymentTermsDays: 0 }) })).paymentDueDate).toBe(
      "2026-10-31",
    );
  });

  it("taxes the subtotal at the business's rate", () => {
    const invoice = createDefaultInvoice(seed({ items: [{ ...item, unitPrice: 200 }] }));
    expect([getInvoiceSubtotal(invoice), getInvoiceTax(invoice)]).toEqual([200, 20]);
  });

  it("is signed by the person who issues it", () => {
    expect(createDefaultInvoice(seed()).from.issuerName).toBe("Alex Morgan");
  });
});

describe("the invoice's client and lines (spec 008, AC8)", () => {
  it("bills the first customer of the list", () => {
    expect(createDefaultInvoice(seed()).to).toEqual(client);
  });

  it("starts with no client when the business has no customers", () => {
    expect(createDefaultInvoice(seed({ clients: [] })).to.name).toBe("");
  });

  it("starts with the catalog lines it is given", () => {
    expect(createDefaultInvoice(seed()).items).toEqual([item]);
  });

  it("names a customer and their email as the directory has them", () => {
    const customer = { id: "C-1", name: "Bravo", email: "bravo@example.com" } as Customer;
    expect(clientOf(customer)).toEqual({
      id: "C-1",
      name: "Bravo",
      email: "bravo@example.com",
      addressLines: [],
      taxId: "",
    });
  });

  it("bills a customer without an email", () => {
    expect(clientOf({ id: "C-2", name: "Calvo" } as Customer).email).toBe("");
  });

  it("writes a catalog item in the request's language, at its price in major units", () => {
    const flan = {
      id: "dish-flan",
      name: { source: "House flan", translations: { en: "House flan", es: "Flan de la casa" } },
      price: { amountMinor: 750, currency: "EUR" },
    } as CatalogItem;
    expect(lineItemOf(flan, "es")).toEqual({
      id: "dish-flan",
      description: "Flan de la casa",
      quantity: 1,
      unitPrice: 7.5,
    });
  });

  it("falls back to the item's own name when it has no translation for the language", () => {
    const flan = {
      id: "dish-flan",
      name: { source: "House flan", translations: { en: "House flan" } },
      price: { amountMinor: 750, currency: "EUR" },
    } as CatalogItem;
    expect(lineItemOf(flan, "de").description).toBe("House flan");
  });
});

const priced = (id: string, amountMinor: number, currency: string) =>
  ({ id, name: { source: id, translations: {} }, price: { amountMinor, currency } }) as CatalogItem;

describe("the lines an invoice starts with, in their own currency", () => {
  it("starts the document in the catalog's currency, whatever the visitor's preference", () => {
    const { currency, items } = startingLines([priced("flan", 750, "EUR")], "USD", "en");
    expect([currency, items.map(({ unitPrice }) => unitPrice)]).toEqual(["EUR", [7.5]]);
  });

  it("leaves out a line priced in another currency than the document's", () => {
    const { items } = startingLines([priced("flan", 750, "EUR"), priced("tea", 300, "GBP")], "USD", "en");
    expect(items.map(({ id }) => id)).toEqual(["flan"]);
  });

  it("keeps the preference and no lines when the catalog is priced in a currency the kit does not offer", () => {
    expect(startingLines([priced("ramen", 1500, "JPY")], "GBP", "en")).toEqual({ currency: "GBP", items: [] });
  });

  it("keeps the preference with an empty catalog", () => {
    expect(startingLines([], "GBP", "en")).toEqual({ currency: "GBP", items: [] });
  });

  it("writes a price in major units by the currency's own decimals", () => {
    expect(lineItemOf(priced("ramen", 1500, "JPY"), "en").unitPrice).toBe(1500);
  });
});

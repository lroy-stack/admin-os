import { describe, expect, it } from "vitest";

import { assertDictionaryParity, errorText } from "@/core/i18n";

import { customersCapabilities } from "./capabilities";
import { matchedFields, normalisePhone } from "./contact";
import { customersErrors } from "./messages";
import { customerContactUpdateInput, customerCreateInput, customerSchema } from "./schema";

const customer = customerSchema.parse({
  id: "c1",
  name: "Ada",
  phone: "+34600000101",
  email: "Ada@Example.com",
  tags: [],
  vip: false,
  blocked: false,
  notes: [],
  figures: { visits: 0, spend: null, lastVisit: null, noShows: 0 },
});

describe("customer write schemas", () => {
  it.each(["600000101", "+0123456", "+34 600 000 101", "not a phone"])("rejects the phone %s as not E.164", (phone) => {
    expect(customerCreateInput.safeParse({ name: "Ada", phone }).success).toBe(false);
  });

  it("accepts an E.164 phone and defaults tags to none", () => {
    expect(customerCreateInput.parse({ name: "Ada", phone: "+34600000101" })).toEqual({
      name: "Ada",
      phone: "+34600000101",
      tags: [],
    });
  });

  it("accepts null to clear the phone or the email", () => {
    expect(customerContactUpdateInput.parse({ id: "c1", phone: null, email: null })).toEqual({
      id: "c1",
      phone: null,
      email: null,
    });
  });

  it.each([
    { phone: "600000101" },
    { email: "ada" },
    { name: null },
    { vip: true },
    { marketingConsent: true },
    { tags: ["vip"] },
  ])("rejects the contact change %j", (change) => {
    expect(customerContactUpdateInput.safeParse({ id: "c1", ...change }).success).toBe(false);
  });

  it("rejects a blank name", () => {
    expect(customerCreateInput.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects an email that is not an email", () => {
    expect(customerCreateInput.safeParse({ name: "Ada", email: "ada" }).success).toBe(false);
  });
});

describe("contact matching", () => {
  it("normalises the separators people type in a phone", () => {
    expect(normalisePhone("+34 (600) 000-101")).toBe("+34600000101");
  });

  it("reads a leading 00 as the + of an international number", () => {
    expect(normalisePhone("0034 600 000 101")).toBe("+34600000101");
  });

  it("matches a phone typed with the 00 international prefix", () => {
    expect(matchedFields(customer, { phone: "0034600000101" })).toEqual(["phone"]);
  });

  it("does not guess a national format: a bare number stays as typed", () => {
    expect(matchedFields(customer, { phone: "600000101" })).toEqual([]);
  });

  it("matches a phone typed with spaces", () => {
    expect(matchedFields(customer, { phone: "+34 600 000 101" })).toEqual(["phone"]);
  });

  it("matches an email regardless of case", () => {
    expect(matchedFields(customer, { email: "ada@example.COM" })).toEqual(["email"]);
  });

  it("reports both fields when both match", () => {
    expect(matchedFields(customer, { phone: "+34600000101", email: "ada@example.com" })).toEqual(["phone", "email"]);
  });

  it("does not match a different contact", () => {
    expect(matchedFields(customer, { phone: "+34600000999", email: "bob@example.com" })).toEqual([]);
  });
});

describe("customers capabilities", () => {
  it.each(Object.values(customersCapabilities).filter((capability) => capability.effect === "write"))(
    "$id is a business write at tier 2",
    (capability) => {
      expect(capability.riskTier).toBe(2);
    },
  );

  it.each(Object.values(customersCapabilities).filter((capability) => capability.effect === "read"))(
    "$id is a personal read at tier 1",
    (capability) => {
      expect(capability.riskTier).toBe(1);
    },
  );

  it.each(["customers.create", "customers.notes.add"] as const)("%s requires an idempotency key", (id) => {
    expect(customersCapabilities[id]).toMatchObject({ requiresIdempotencyKey: true });
  });
});

describe("customers error texts", () => {
  it("passes the dictionary parity check in four languages", () => {
    expect(() => assertDictionaryParity(customersErrors)).not.toThrow();
  });

  it("explains a duplicate in French from its own code", () => {
    expect(errorText({ code: "customers.duplicate" }, customersErrors, "fr")).toContain("existe déjà");
  });

  it("falls back to the class text for a code it does not own", () => {
    expect(errorText({ code: "customers.forbidden" }, customersErrors, "en")).toBe(
      "You do not have permission to do this.",
    );
  });
});

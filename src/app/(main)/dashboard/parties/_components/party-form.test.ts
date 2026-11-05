import { describe, expect, it } from "vitest";

import { partyCreateInput, partyUpdateInput } from "@/modules/parties";

import type { PartyRow } from "./directory-model";
import { partyDirectoryMessages } from "./messages.server";
import { EMPTY_PARTY, type PartyFormInput, partyFormSchema, toCreateInput, toForm, toUpdateInput } from "./party-form";

const invalid = partyDirectoryMessages.en.form.invalid;
const schema = partyFormSchema(invalid);
const typed = (input: Partial<PartyFormInput> = {}): PartyFormInput => ({
  ...EMPTY_PARTY,
  legalName: "Acme S.L.",
  taxId: "B00000999",
  addressLines: "Calle Mayor 1\n 28001 Madrid ",
  email: "billing@acme.example",
  ...input,
});

const messagesOf = (input: PartyFormInput) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("party form schema", () => {
  it("yields the create input: trimmed address lines, upper-case country, blank optionals absent", () => {
    const values = schema.parse(typed({ countryCode: " es " }));

    expect(values.addressLines).toEqual(["Calle Mayor 1", "28001 Madrid"]);
    expect(values.countryCode).toBe("ES");
    expect(partyCreateInput.parse(toCreateInput(values))).toEqual({
      kind: "company",
      legalName: "Acme S.L.",
      taxId: "B00000999",
      addressLines: ["Calle Mayor 1", "28001 Madrid"],
      countryCode: "ES",
      email: "billing@acme.example",
      roles: ["client"],
    });
  });

  it("accepts the phone as people type it and hands over E.164", () => {
    expect(schema.parse(typed({ phone: "0034 600 000 101" })).phone).toBe("+34600000101");
  });

  it("says what is wrong, field by field, in the dictionary's words", () => {
    expect(messagesOf(typed({ legalName: " ", taxId: "", addressLines: "\n ", roles: [] }))).toEqual([
      invalid.legalName,
      invalid.taxId,
      invalid.address,
      invalid.roles,
    ]);
    expect(messagesOf(typed({ countryCode: "ESP", email: "nope", phone: "600 000 101" }))).toEqual([
      invalid.countryCode,
      invalid.email,
      invalid.phone,
    ]);
  });
});

describe("editing a party", () => {
  const row: PartyRow = {
    id: "p1",
    kind: "company",
    legalName: "Acme S.L.",
    taxId: "B00000999",
    addressLines: ["Calle Mayor 1"],
    countryCode: "ES",
    email: "billing@acme.example",
    roles: ["supplier"],
  };

  it("starts from the party, with the optional fields it lacks blank", () => {
    expect(toForm(row)).toEqual({
      kind: "company",
      legalName: "Acme S.L.",
      tradeName: "",
      taxId: "B00000999",
      addressLines: "Calle Mayor 1",
      countryCode: "ES",
      email: "billing@acme.example",
      phone: "",
      roles: ["supplier"],
      notes: "",
    });
  });

  it("clears an optional field left blank with null", () => {
    const input = toUpdateInput("p1", schema.parse(toForm(row)));

    expect(input).toMatchObject({ id: "p1", tradeName: null, phone: null, notes: null });
    expect(partyUpdateInput.parse(input)).toEqual(input);
  });
});

import { describe, expect, it } from "vitest";

import { contactFieldsMessages } from "../contact-fields-messages";
import { customerCreateInput } from "../schema";
import { contactFormSchema, contactQuery, toCreateInput, toUpdateInput } from "./contact-form";

const invalid = contactFieldsMessages.en.invalid;
const schema = contactFormSchema(invalid);
const typed = (input: Partial<{ name: string; phone: string; email: string }>) => ({
  name: "Ada",
  phone: "",
  email: "",
  ...input,
});

describe("contact form schema", () => {
  it("leaves a blank phone and a blank email out", () => {
    expect(schema.parse(typed({ phone: "  ", email: "" }))).toEqual({ name: "Ada" });
  });

  it("accepts the phone as people type it and hands over E.164", () => {
    expect(schema.parse(typed({ phone: "+34 (600) 000-101" })).phone).toBe("+34600000101");
  });

  it("reads a leading 00 as the + of the country code", () => {
    expect(schema.parse(typed({ phone: "0034 600 000 101" })).phone).toBe("+34600000101");
  });

  it("rejects a national number with the dictionary sentence, as the capability does not guess a country", () => {
    const result = schema.safeParse(typed({ phone: "600 000 101" }));

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([invalid.phone]);
  });

  it("rejects a blank name with the dictionary sentence", () => {
    const result = schema.safeParse(typed({ name: "   " }));

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([invalid.name]);
  });

  it("rejects an email that is not one with the dictionary sentence", () => {
    const result = schema.safeParse(typed({ email: "ada@" }));

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([invalid.email]);
  });

  it("rejects a name longer than the create schema allows", () => {
    expect(schema.safeParse(typed({ name: "a".repeat(121) })).success).toBe(false);
  });

  it("yields a value that the create schema accepts", () => {
    const values = schema.parse(typed({ phone: "+34 600 000 101", email: "ada@example.com" }));

    expect(customerCreateInput.safeParse(toCreateInput(values)).success).toBe(true);
  });
});

describe("toCreateInput", () => {
  it("sends only what was filled in", () => {
    expect(toCreateInput({ name: "Ada", phone: undefined, email: "ada@example.com" })).toEqual({
      name: "Ada",
      email: "ada@example.com",
    });
  });
});

describe("contactQuery", () => {
  it("is null while neither detail is complete", () => {
    expect(contactQuery({ name: "", phone: "+34 600", email: "ada@" })).toBeNull();
  });

  it("holds the phone as E.164 once it is complete", () => {
    expect(contactQuery({ name: "", phone: "+34 600 000 101", email: "" })).toEqual({ phone: "+34600000101" });
  });

  it("holds both details when both are complete", () => {
    expect(contactQuery({ name: "", phone: "0034600000101", email: " Ada@Example.com " })).toEqual({
      phone: "+34600000101",
      email: "Ada@Example.com",
    });
  });

  it("holds the email alone when the phone is a national number", () => {
    expect(contactQuery({ name: "", phone: "600000101", email: "ada@example.com" })).toEqual({
      email: "ada@example.com",
    });
  });
});

const CUSTOMER_ID = "C-ortega";

describe("toUpdateInput", () => {
  it("sends a cleared phone and email as null, which clears them", () => {
    expect(toUpdateInput(CUSTOMER_ID, { name: "Ortega" })).toEqual({
      id: CUSTOMER_ID,
      name: "Ortega",
      phone: null,
      email: null,
    });
  });

  it("sends the details that are filled in", () => {
    expect(toUpdateInput(CUSTOMER_ID, { name: "Ortega", phone: "+34600000102", email: "o@example.com" })).toEqual({
      id: CUSTOMER_ID,
      name: "Ortega",
      phone: "+34600000102",
      email: "o@example.com",
    });
  });
});

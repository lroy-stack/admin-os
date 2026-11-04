import { describe, expect, it } from "vitest";

import { addressesOf, mailComposeSchema, recipientsOf } from "./mail-compose-form";
import { mailMessages } from "./messages.server";

const errors = mailMessages.en.compose.errors;
const schema = mailComposeSchema(errors);
const valid = { to: "bea@example.com", cc: "", subject: "Opening hours", body: "We open at nine." };
const messagesFor = (input: object) => {
  const result = schema.safeParse({ ...valid, ...input });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("addresses", () => {
  it.each([
    { text: "a@x.com", expected: ["a@x.com"] },
    { text: "a@x.com, b@x.com;c@x.com  d@x.com", expected: ["a@x.com", "b@x.com", "c@x.com", "d@x.com"] },
    { text: "  ,  ", expected: [] },
  ])("reads $expected from '$text'", ({ text, expected }) => {
    expect(addressesOf(text)).toEqual(expected);
  });

  it("shows an address typed with no name as itself", () => {
    expect(recipientsOf("a@x.com")).toEqual([{ name: "a@x.com", email: "a@x.com" }]);
  });
});

describe("the compose form", () => {
  it("accepts a complete message", () => {
    expect(messagesFor({})).toEqual([]);
  });

  it("accepts several addresses in To and Cc", () => {
    expect(messagesFor({ to: "a@x.com, b@x.com", cc: "c@x.com" })).toEqual([]);
  });

  it("asks for a recipient", () => {
    expect(messagesFor({ to: "  " })).toEqual([errors.toRequired]);
  });

  it.each([{ to: "not-an-address" }, { to: "a@x.com, nope" }, { cc: "nope" }])(
    "rejects an invalid address in $to $cc",
    (input) => {
      expect(messagesFor(input)).toEqual([errors.addressInvalid]);
    },
  );

  it("asks for a subject and a message", () => {
    expect(messagesFor({ subject: " ", body: "" })).toEqual([errors.subjectRequired, errors.bodyRequired]);
  });
});

import { describe, expect, it } from "vitest";

import { dealFormSchema, dealToForm, emptyDealForm, formToFields } from "./deal-form";

const errors = {
  titleRequired: "title",
  customerRequired: "customer",
  valueInvalid: "value",
  stageInvalid: "stage",
  closeDateInvalid: "date",
  ownersRequired: "owners",
};
const schema = dealFormSchema(errors);
const valid = {
  ...emptyDealForm("proposal"),
  title: " Roof ",
  customerId: "c01",
  value: "1200",
  ownerIds: ["km", "iv"],
};

const messageAt = (input: unknown, field: string) =>
  schema.safeParse(input).error?.issues.find((issue) => issue.path[0] === field)?.message;

describe("the deal form", () => {
  it("parses a valid form into the fields of a deal, owners in team order", () => {
    const parsed = schema.parse(valid);

    expect(formToFields(parsed)).toEqual({
      title: "Roof",
      customerId: "c01",
      stage: "proposal",
      value: 1200,
      closeDate: valid.closeDate,
      ownerIds: ["iv", "km"],
    });
  });

  it("presets the stage of the column it was opened from", () => {
    expect(emptyDealForm("closing").stage).toBe("closing");
  });

  it("round-trips an existing deal", () => {
    const fields = formToFields(schema.parse(valid));

    expect(formToFields(schema.parse(dealToForm({ id: "x", ...fields })))).toEqual(fields);
  });

  it.each([
    ["title", { title: "   " }, "title"],
    ["customerId", { customerId: "" }, "customer"],
    ["value", { value: "" }, "value"],
    ["value", { value: "abc" }, "value"],
    ["value", { value: "-5" }, "value"],
    ["value", { value: "0" }, "value"],
    ["closeDate", { closeDate: "tomorrow" }, "date"],
    ["ownerIds", { ownerIds: [] }, "owners"],
    ["ownerIds", { ownerIds: ["nobody"] }, "owners"],
    ["stage", { stage: "won" }, "stage"],
  ])("rejects a bad %s with the dictionary's message", (field, change, message) => {
    expect(messageAt({ ...valid, ...change }, field)).toBe(message);
  });
});

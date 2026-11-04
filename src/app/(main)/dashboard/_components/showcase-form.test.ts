import { describe, expect, it } from "vitest";

import { emptyShowcaseValues, type ShowcaseField, showcaseFormSchema } from "./showcase-form";

const errors = { required: "Required", numberInvalid: "Not a number" };

const fields: readonly ShowcaseField[] = [
  { name: "title", label: "Title", kind: "text", required: true },
  { name: "size", label: "Size", kind: "number" },
  {
    name: "kind",
    label: "Kind",
    kind: "select",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
];

describe("emptyShowcaseValues", () => {
  it("starts text empty and selects on their first option", () => {
    expect(emptyShowcaseValues(fields)).toEqual({ title: "", size: "", kind: "a" });
  });
});

describe("showcaseFormSchema", () => {
  const schema = showcaseFormSchema(fields, errors);

  it("trims the values it accepts", () => {
    expect(schema.parse({ title: "  Plan  ", size: " 4 ", kind: "b" })).toEqual({
      title: "Plan",
      size: "4",
      kind: "b",
    });
  });

  it("reports a blank required field in the dictionary's words", () => {
    const result = schema.safeParse({ title: "  ", size: "", kind: "a" });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Required"]);
  });

  it("rejects a negative number", () => {
    const result = schema.safeParse({ title: "x", size: "-1", kind: "a" });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Not a number"]);
  });

  it("rejects text where a number belongs", () => {
    const result = schema.safeParse({ title: "x", size: "abc", kind: "a" });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Not a number"]);
  });
});

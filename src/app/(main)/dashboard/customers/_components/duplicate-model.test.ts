import { describe, expect, it } from "vitest";

import { type DuplicateMatch, directoryHref, queryKey, reasonOf } from "./duplicate-model";

const match = (matchedOn: DuplicateMatch["matchedOn"]): DuplicateMatch => ({ id: "c1", name: "Ortega", matchedOn });
const query = { phone: "+34600000102", email: "ortega@example.com" };

describe("duplicate model", () => {
  it("names the reason: phone, email or both", () => {
    expect([reasonOf(match(["phone"])), reasonOf(match(["email"])), reasonOf(match(["phone", "email"]))]).toEqual([
      "phone",
      "email",
      "both",
    ]);
  });

  it("links to the directory searched by the shared phone", () => {
    expect(directoryHref(match(["phone"]), query)).toBe("/dashboard/customers?q=%2B34600000102");
  });

  it("links to the directory searched by the shared email when it matched", () => {
    expect(directoryHref(match(["email"]), query)).toBe("/dashboard/customers?q=ortega%40example.com");
  });

  it("prefers the email when both matched, as it is the narrower search for one record", () => {
    expect(directoryHref(match(["phone", "email"]), query)).toBe("/dashboard/customers?q=ortega%40example.com");
  });

  it("gives the same key for the same query and an empty key for none", () => {
    expect([queryKey(null), queryKey(query) === queryKey({ ...query })]).toEqual(["", true]);
  });
});

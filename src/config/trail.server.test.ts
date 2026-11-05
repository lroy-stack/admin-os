import { describe, expect, it } from "vitest";

import { homeLevel } from "./trail.server";

describe("a page trail's home level (ADR 0020 §2)", () => {
  it.each([
    ["hospitality", "en", "Home"],
    ["hospitality", "es", "Inicio"],
    ["salon", "de", "Start"],
    ["workshop", "fr", "Accueil"],
  ] as const)("names the %s home in %s as its nav does: %s", (vertical, locale, label) => {
    expect(homeLevel(vertical, locale)).toEqual({ label, href: "/dashboard/default" });
  });
});

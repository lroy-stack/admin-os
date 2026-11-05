import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { inventoryViewsMessages } from "../views-messages";
import { onHandText } from "./units";

// Identical on purpose: SKU is one abbreviation, and the fallback names the count and the code as stored.
const SAME_EVERYWHERE = ["stock.columns.sku", "stock.onHand"];

const textOf = (locale: "en" | "es" | "de" | "fr") => inventoryViewsMessages[locale].stock;

describe("onHandText", () => {
  it("says a known unit in the locale's words, singular or plural", () => {
    expect(onHandText(textOf("es"), "es", 12, "bottle")).toBe("12 botellas");
    expect(onHandText(textOf("es"), "es", 1, "bottle")).toBe("1 botella");
    expect(onHandText(textOf("fr"), "fr", 3, "jar")).toBe("3 pots");
    expect(onHandText(textOf("de"), "de", 24, "tube")).toBe("24 Tuben");
    expect(onHandText(textOf("en"), "en", 5, "litre")).toBe("5 litres");
  });

  it("shows a unit it does not know as stored", () => {
    expect(onHandText(textOf("es"), "es", 4, "crate")).toBe("4 crate");
  });

  it("does not read a prototype property as a unit", () => {
    expect(onHandText(textOf("en"), "en", 2, "constructor")).toBe("2 constructor");
  });

  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(inventoryViewsMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});

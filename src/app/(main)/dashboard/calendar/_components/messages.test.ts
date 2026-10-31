import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { calendarMessages } from "./messages.server";

// Identical on purpose: hours and time ranges only join numbers with a unit or a dash.
const SAME_EVERYWHERE = ["kpis.hours", "sidebar.timeRange"];

describe("calendar dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(calendarMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});

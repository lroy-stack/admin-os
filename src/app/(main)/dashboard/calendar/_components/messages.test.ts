import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { calendarMessages } from "./messages.server";

// Identical on purpose: hours, time ranges and an event's date and time only join values with a unit, a dot or a dash.
const SAME_EVERYWHERE = ["kpis.hours", "sidebar.timeRange", "event.timed", "event.range"];

describe("calendar dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(calendarMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});

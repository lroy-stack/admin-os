import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { locateTables } from "./floor/floor-model";
import { mockVenue } from "./floor/venue";
import { bookingsMessages } from "./messages.server";

// Identical on purpose: units and joins of values that no language writes differently, technical terms and loanwords.
const SAME_EVERYWHERE = [
  // The owner keeps "Walk-in" untranslated in every language: it is the term staff use, and translations confused them.
  "actions.walkIn",
  "channels.walk-in",
  "walkInGuest",
  "late.short",
  "duration.minutes",
  "duration.hours",
  "duration.hoursMinutes",
  "rail.summary",
  "rail.slotLine",
  "rail.slotLabel",
  "callout.seatsInZone",
  "floor.plateEdit",
  "floor.plateService",
  "floor.views.flat",
  "floor.views.perspective",
  "editor.preset",
  "editor.fields.x",
  "editor.fields.y",
  "editor.fields.zoneSummary",
  "drawer.summary",
  "agenda.laneSubtitle",
  "channels.web",
  "channels.whatsapp",
  "channels.instagram",
  "channels.facebook",
  "channels.sms",
  "channels.google",
  "allergens.gluten",
];

describe("bookings dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(bookingsMessages, SAME_EVERYWHERE)).not.toThrow();
  });

  it.each(LOCALES)("names every level, zone and landmark of the demo room in %s", (locale) => {
    const venue = bookingsMessages[locale].venue;
    const names = [
      ...mockVenue.levels.map((level) => venue.levels[level.id]),
      ...mockVenue.levels.flatMap((level) => level.zones.map((zone) => venue.zones[zone.id])),
      ...mockVenue.levels.flatMap((level) =>
        level.landmarks
          .filter((landmark) => landmark.kind !== "column" && landmark.kind !== "plant")
          .map((landmark) => venue.landmarks[landmark.id]),
      ),
    ];
    expect(names.filter((name) => !name)).toEqual([]);
  });

  it("keeps the demo room free of baked-in names, so they follow the language", () => {
    const stored = mockVenue.levels.flatMap((level) => [
      level.name,
      ...level.zones.map((zone) => zone.name),
      ...level.landmarks.map((landmark) => landmark.label),
    ]);
    expect(stored.filter((name) => name !== "")).toEqual([]);
    expect(locateTables(mockVenue).length).toBeGreaterThan(0);
  });
});

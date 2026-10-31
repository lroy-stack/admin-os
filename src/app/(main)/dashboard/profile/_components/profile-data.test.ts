import { describe, expect, it } from "vitest";

import { profileMessages } from "./messages.server";
import { localizeProfile } from "./profile-data";

describe("localizeProfile", () => {
  it.each([
    ["en", "March 18, 2022", "4 years and 4 months", "40 hours", "Monday–Friday · 9:00 AM–5:30 PM"],
    ["es", "18 de marzo de 2022", "4 años y 4 meses", "40 horas", "De lunes a viernes · 9:00–17:30"],
    ["de", "18. März 2022", "4 Jahre und 4 Monate", "40 Stunden", "Montag bis Freitag · 09:00–17:30 Uhr"],
    ["fr", "18 mars 2022", "4 ans et 4 mois", "40 heures", "Lundi au vendredi · 09:00–17:30"],
  ] as const)("writes dates, durations and the schedule in %s", (locale, startDate, length, hours, schedule) => {
    const profile = localizeProfile(profileMessages[locale], locale);

    expect([profile.startDate, profile.engagementLength, profile.weeklyHours, profile.schedule]).toEqual([
      startDate,
      length,
      hours,
      schedule,
    ]);
  });

  it.each(["en", "es", "de", "fr"] as const)("leaves no unresolved placeholder in %s", (locale) => {
    const profile = localizeProfile(profileMessages[locale], locale);

    expect(JSON.stringify(profile)).not.toMatch(/\{\w+\}/);
  });
});

import { describe, expect, it } from "vitest";

import type { CustomerNote } from "@/modules/customers";

import { attendanceOf, consentOf, contactOf, newestFirst, noteMoment } from "./record-model";

const note = (id: string, day: string, minute: number): CustomerNote => ({
  id,
  text: id,
  authorId: "staff-1",
  authorName: "Staff",
  day,
  minute,
});

describe("attendanceOf", () => {
  it.each([
    { visits: 8, noShows: 2, kept: 8, booked: 10, ratio: 0.8 },
    { visits: 6, noShows: 0, kept: 6, booked: 6, ratio: 1 },
    { visits: 0, noShows: 3, kept: 0, booked: 3, ratio: 0 },
  ])("keeps $visits of $booked when $noShows were missed", ({ visits, noShows, ...expected }) => {
    expect(attendanceOf({ visits, noShows })).toEqual(expected);
  });

  it("has no ring when nothing was booked", () => {
    expect(attendanceOf({ visits: 0, noShows: 0 })).toBeNull();
  });
});

describe("newestFirst", () => {
  const morning = note("morning", "2026-09-30", 9 * 60);
  const evening = note("evening", "2026-09-30", 21 * 60);
  const earlier = note("earlier", "2026-09-01", 23 * 60);

  it("puts the latest day and minute on top", () => {
    expect(newestFirst([earlier, morning, evening]).map((entry) => entry.id)).toEqual([
      "evening",
      "morning",
      "earlier",
    ]);
  });

  it("orders notes stored in any order the same way", () => {
    expect(newestFirst([evening, earlier, morning]).map((entry) => entry.id)).toEqual([
      "evening",
      "morning",
      "earlier",
    ]);
  });

  it("puts the later-written of two notes at the same minute first", () => {
    const first = note("first", "2026-09-30", 600);
    const second = note("second", "2026-09-30", 600);
    expect(newestFirst([first, second]).map((entry) => entry.id)).toEqual(["second", "first"]);
  });

  it("does not change its input", () => {
    const input = [earlier, evening];
    newestFirst(input);
    expect(input.map((entry) => entry.id)).toEqual(["earlier", "evening"]);
  });

  it("is empty for no notes", () => {
    expect(newestFirst([])).toEqual([]);
  });
});

describe("noteMoment", () => {
  it("reads the minute as wall-clock time on the business day", () => {
    expect(noteMoment({ day: "2026-09-30", minute: 21 * 60 + 5 }).toISOString()).toBe("2026-09-30T21:05:00.000Z");
  });
});

describe("consentOf", () => {
  it.each([
    { consent: { marketing: true }, expected: "granted" },
    { consent: { marketing: false }, expected: "declined" },
    { consent: undefined, expected: "unknown" },
  ])("is $expected for $consent", ({ consent, expected }) => {
    expect(consentOf(consent)).toBe(expected);
  });
});

describe("contactOf", () => {
  it("lists what the customer gave, with the language in the page's language", () => {
    expect(contactOf({ name: "Ortega", email: "o@example.com", phone: "+34600000102", locale: "es" }, "en")).toEqual({
      name: "Ortega",
      email: "o@example.com",
      phone: "+34600000102",
      language: "Spanish",
    });
  });

  it("leaves a missing email, phone or language as null", () => {
    expect(contactOf({ name: "Calvo" }, "en")).toEqual({ name: "Calvo", email: null, phone: null, language: null });
  });
});

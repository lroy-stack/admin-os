import { describe, expect, it } from "vitest";

import { mailtoHref, telHref, websiteUrl } from "./contact-links";

describe("contact links", () => {
  it.each([
    { phone: "+1 (415) 555-0123", expected: "tel:+14155550123" },
    { phone: "020 7946 0958", expected: "tel:02079460958" },
    { phone: "", expected: null },
    { phone: "  ", expected: null },
    { phone: "+", expected: null },
  ])("turns '$phone' into $expected", ({ phone, expected }) => {
    expect(telHref(phone)).toBe(expected);
  });

  it.each([
    { email: "olivia.rhye@weblabs.studio", expected: "mailto:olivia.rhye@weblabs.studio" },
    { email: "  a@x.com ", expected: "mailto:a@x.com" },
    { email: "", expected: null },
  ])("turns '$email' into $expected", ({ email, expected }) => {
    expect(mailtoHref(email)).toBe(expected);
  });

  it.each([
    { website: "railway.co", expected: "https://railway.co" },
    { website: "http://railway.co", expected: "http://railway.co" },
    { website: "", expected: null },
  ])("turns '$website' into $expected", ({ website, expected }) => {
    expect(websiteUrl(website)).toBe(expected);
  });
});

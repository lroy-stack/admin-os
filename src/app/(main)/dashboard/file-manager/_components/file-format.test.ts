import { describe, expect, it } from "vitest";

import { formatFileSize, formatModified } from "./file-format";

describe("file sizes", () => {
  it.each([
    ["en", 8_400_000, "8.4 MB"],
    ["de", 8_400_000, "8,4 MB"],
    ["en", 840_000_000, "840 MB"],
    ["en", 1_800_000_000, "1.8 GB"],
    ["en", 950, "950 byte"],
  ] as const)("writes %s %d as %s", (locale, bytes, expected) => {
    expect(formatFileSize(bytes, locale)).toBe(expected);
  });
});

describe("modified times", () => {
  it.each([
    ["en", "2026-10-31T17:48:00Z", "12 minutes ago"],
    ["en", "2026-10-30T14:00:00Z", "yesterday"],
    ["es", "2026-10-30T14:00:00Z", "ayer"],
    ["en", "2026-10-26T09:30:00Z", "Oct 26, 2026"],
    ["fr", "2026-10-26T09:30:00Z", "26 oct. 2026"],
  ] as const)("writes %s %s as %s", (locale, instant, expected) => {
    expect(formatModified(instant, locale)).toBe(expected);
  });
});

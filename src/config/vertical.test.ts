import { describe, expect, it, vi } from "vitest";

import { resolveVertical, VERTICALS } from "./vertical";
import { getVertical } from "./vertical.server";

describe("resolveVertical", () => {
  it.each([[undefined], [""]])("falls back to hospitality for %j", (raw) => {
    expect(resolveVertical(raw)).toBe(VERTICALS.hospitality);
  });

  it("resolves a known id", () => {
    expect(resolveVertical("salon")).toBe(VERTICALS.salon);
  });

  it.each([["Salon"], ["foo"]])("rejects %j and names the allowed values", (raw) => {
    expect(() => resolveVertical(raw)).toThrow(/VERTICAL must be one of hospitality, salon, workshop/);
  });
});

describe("getVertical", () => {
  it("reads VERTICAL on every call", () => {
    vi.stubEnv("VERTICAL", "workshop");
    const first = getVertical();
    vi.stubEnv("VERTICAL", "salon");
    const second = getVertical();
    vi.unstubAllEnvs();
    expect([first.id, second.id]).toEqual(["workshop", "salon"]);
  });
});
